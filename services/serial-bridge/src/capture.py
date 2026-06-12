#!/usr/bin/env python3
import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

import cv2


def avfoundation_unique_ids_available():
    """Whether real AVFoundation hardware uniqueIDs can be read (pyobjc present).

    When False, camera persistence falls back to name-derived identifiers.
    """
    try:
        import AVFoundation  # type: ignore

        return hasattr(AVFoundation, "AVCaptureDevice")
    except Exception:
        return False


def _avfoundation_uid_map():
    """Map a device's display name -> stable AVFoundation uniqueID.

    Uses pyobjc (AVFoundation) when available. The uniqueID survives reconnects,
    reboots and index reshuffling, unlike the AVFoundation device index. Returns
    an empty map when pyobjc is unavailable, in which case callers fall back to a
    name-derived identifier.
    """
    try:
        import AVFoundation  # type: ignore
    except Exception:
        return {}

    uid_map = {}
    try:
        devices = AVFoundation.AVCaptureDevice.devicesWithMediaType_(
            AVFoundation.AVMediaTypeVideo
        )
        for device in devices or []:
            try:
                uid_map[str(device.localizedName())] = str(device.uniqueID())
            except Exception:
                continue
    except Exception:
        return {}
    return uid_map


def list_avfoundation_devices():
    proc = subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-f",
            "avfoundation",
            "-list_devices",
            "true",
            "-i",
            "",
        ],
        capture_output=True,
        text=True,
        timeout=10,
    )
    text = f"{proc.stdout}\n{proc.stderr}"
    uid_map = _avfoundation_uid_map()
    devices = []
    in_video = False
    for line in text.splitlines():
        if "AVFoundation video devices" in line:
            in_video = True
            continue
        if "AVFoundation audio devices" in line:
            in_video = False
            continue
        if not in_video:
            continue
        match = re.search(r"\[(\d+)\]\s+(.+)$", line)
        if match:
            name = match.group(2).strip()
            # Prefer the real AVFoundation uniqueID; fall back to a stable
            # name-derived token so persistence still beats the volatile index.
            uid = uid_map.get(name) or f"name:{name}"
            devices.append({"index": int(match.group(1)), "name": name, "uid": uid})
    return devices


def output_dir():
    root = Path(__file__).resolve().parents[3]
    path = Path(os.getenv("CAMERA_SNAPSHOT_DIR", root / "data" / "camera-snapshots"))
    path.mkdir(parents=True, exist_ok=True)
    return path


def capture_snapshot(device_index):
    cap = cv2.VideoCapture(device_index, cv2.CAP_AVFOUNDATION)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    if not cap.isOpened():
        return None

    frame = None
    for _ in range(12):
        ok, candidate = cap.read()
        if ok and candidate is not None:
            frame = candidate
        time.sleep(0.05)
    cap.release()

    if frame is None:
        return None

    filename = f"snapshot-{int(time.time() * 1000)}.jpg"
    path = output_dir() / filename
    if not cv2.imwrite(str(path), frame, [cv2.IMWRITE_JPEG_QUALITY, 92]):
        return None
    return str(path)


class CameraNotFoundError(RuntimeError):
    pass


def default_device_index():
    configured = os.getenv("CAMERA_DEVICE")
    if configured is not None:
        return int(configured)

    devices = list_avfoundation_devices()
    for device in devices:
        name = device["name"].lower()
        if "iphone" in name and "desk view" not in name:
            return device["index"]

    raise CameraNotFoundError("No iPhone camera detected via Continuity Camera")


def main():
    parser = argparse.ArgumentParser(description="Capture iPhone/AVFoundation camera snapshots for Fishlinic.")
    parser.add_argument("--list", action="store_true", help="List AVFoundation video devices as JSON.")
    parser.add_argument(
        "--capabilities",
        action="store_true",
        help="Report camera capabilities (AVFoundation uniqueID support) as JSON.",
    )
    parser.add_argument(
        "--resolve",
        action="store_true",
        help="Resolve and print the selected camera device index as JSON.",
    )
    parser.add_argument("--device", type=int)
    args = parser.parse_args()

    if args.capabilities:
        print(json.dumps({"avfUniqueIds": avfoundation_unique_ids_available()}))
        return 0

    if args.list:
        try:
            print(json.dumps({"devices": list_avfoundation_devices()}))
        except Exception as exc:
            print(json.dumps({"devices": [], "error": str(exc)}))
        return 0

    if args.resolve:
        try:
            index = args.device if args.device is not None else default_device_index()
        except CameraNotFoundError as exc:
            print(json.dumps({"error": str(exc)}))
            return 1
        names = {d["index"]: d["name"] for d in list_avfoundation_devices()}
        print(json.dumps({"index": index, "name": names.get(index, "")}))
        return 0

    try:
        device_index = args.device if args.device is not None else default_device_index()
    except CameraNotFoundError as exc:
        print(f"ERROR: {exc}", file=sys.stdout)
        return 1

    path = capture_snapshot(device_index)
    if not path:
        print("ERROR: Camera capture failed", file=sys.stdout)
        return 1

    print(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
