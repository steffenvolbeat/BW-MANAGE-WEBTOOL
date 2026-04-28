#!/usr/bin/env python3
"""
Generiert alle PWA-Icons für BW-Manage-Webtool aus einem SVG.
Benötigt: cairosvg oder Pillow (pip install cairosvg pillow)
"""
import subprocess, sys, os

SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#0f172a"/>
  <rect x="60" y="60" width="392" height="392" rx="60" fill="#1e293b"/>
  <!-- BW Monogramm -->
  <text x="256" y="200" font-family="Arial,sans-serif" font-size="140" font-weight="900"
        text-anchor="middle" fill="#6366f1">BW</text>
  <!-- Untertitel -->
  <text x="256" y="290" font-family="Arial,sans-serif" font-size="44" font-weight="700"
        text-anchor="middle" fill="#94a3b8">MANAGE</text>
  <!-- Dekorative Linie -->
  <rect x="120" y="320" width="272" height="4" rx="2" fill="#6366f1" opacity="0.7"/>
  <!-- Webtool Text -->
  <text x="256" y="390" font-family="Arial,sans-serif" font-size="34" font-weight="400"
        text-anchor="middle" fill="#475569">webtool</text>
</svg>"""

SVG_PATH = "/tmp/bw-manage-icon.svg"
OUT_DIR  = os.path.join(os.path.dirname(__file__), "public", "icons")
SIZES    = [72, 96, 128, 144, 152, 192, 384, 512]

with open(SVG_PATH, "w") as f:
    f.write(SVG)

print(f"SVG gespeichert: {SVG_PATH}")

# Versuch 1: cairosvg
try:
    import cairosvg
    for size in SIZES:
        out = os.path.join(OUT_DIR, f"icon-{size}x{size}.png")
        cairosvg.svg2png(url=SVG_PATH, write_to=out, output_width=size, output_height=size)
        print(f"  ✓ {out}")
    print("Alle Icons mit cairosvg erstellt.")
    sys.exit(0)
except ImportError:
    pass

# Versuch 2: rsvg-convert (librsvg)
if subprocess.run(["which", "rsvg-convert"], capture_output=True).returncode == 0:
    for size in SIZES:
        out = os.path.join(OUT_DIR, f"icon-{size}x{size}.png")
        subprocess.run(["rsvg-convert", "-w", str(size), "-h", str(size), "-o", out, SVG_PATH], check=True)
        print(f"  ✓ {out}")
    print("Alle Icons mit rsvg-convert erstellt.")
    sys.exit(0)

# Versuch 3: Inkscape
if subprocess.run(["which", "inkscape"], capture_output=True).returncode == 0:
    for size in SIZES:
        out = os.path.join(OUT_DIR, f"icon-{size}x{size}.png")
        subprocess.run([
            "inkscape", "--export-type=png",
            f"--export-filename={out}",
            f"--export-width={size}", f"--export-height={size}",
            SVG_PATH
        ], check=True, capture_output=True)
        print(f"  ✓ {out}")
    print("Alle Icons mit Inkscape erstellt.")
    sys.exit(0)

# Versuch 4: ImageMagick convert
if subprocess.run(["which", "convert"], capture_output=True).returncode == 0:
    for size in SIZES:
        out = os.path.join(OUT_DIR, f"icon-{size}x{size}.png")
        subprocess.run([
            "convert", "-background", "none",
            "-resize", f"{size}x{size}",
            SVG_PATH, out
        ], check=True)
        print(f"  ✓ {out}")
    print("Alle Icons mit ImageMagick erstellt.")
    sys.exit(0)

print("FEHLER: Kein Konverter gefunden (cairosvg, rsvg-convert, inkscape, convert).")
print("Installiere einen: sudo apt install librsvg2-bin  ODER  pip install cairosvg")
sys.exit(1)
