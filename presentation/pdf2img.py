"""Convert PDF to per-page JPEG using PyMuPDF (no external poppler dep)."""
import sys, os, subprocess

# Try PyMuPDF first
try:
    import fitz
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "PyMuPDF"], check=True, capture_output=True)
    import fitz

pdf_path = "Fishlinic_Capstone_Presentation.pdf"
doc = fitz.open(pdf_path)
zoom = 110 / 72
mat = fitz.Matrix(zoom, zoom)
for i, page in enumerate(doc, start=1):
    pix = page.get_pixmap(matrix=mat)
    out = f"slide-{i:02d}.jpg"
    pix.save(out, jpg_quality=85)
    print(f"saved {out} ({pix.width}x{pix.height})")
doc.close()
