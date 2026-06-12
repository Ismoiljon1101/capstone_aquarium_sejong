@echo off
REM Compile Fishinic LaTeX documentation to PDF
REM Usage: compile_tex.bat

cd /d "%~dp0"

echo Compiling ismoil-complete-doc.tex with pdflatex...
pdflatex -interaction=nonstopmode ismoil-complete-doc.tex
pdflatex -interaction=nonstopmode ismoil-complete-doc.tex

if exist ismoil-complete-doc.pdf (
    echo SUCCESS: PDF generated at ismoil-complete-doc.pdf
    start ismoil-complete-doc.pdf
) else (
    echo ERROR: PDF not generated. Check ismoil-complete-doc.log for errors.
)
