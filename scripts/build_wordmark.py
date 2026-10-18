"""Outline the existing Barlow wordmark. No runtime font or bitmap is embedded."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
ROOT=Path(__file__).resolve().parents[1]
font=TTFont(ROOT/'node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-500-normal.woff')
glyphs=font.getGlyphSet();mapping=font.getBestCmap();units=font['head'].unitsPerEm

def line(text,size,tracking,y,color):
    scale=size/units;x=0;paths=[]
    for char in text:
        name=mapping[ord(char)];pen=SVGPathPen(glyphs);glyphs[name].draw(pen)
        paths.append(f'<path transform="translate({x:.3f} 0)" d="{pen.getCommands()}"/>')
        x+=font['hmtx'][name][0]+tracking/scale
    return f'<g fill="{color}" transform="translate(8 {y}) scale({scale} {-scale})">'+''.join(paths)+'</g>'
svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 88" role="img" aria-labelledby="title"><title id="title">ALURA IREZUMI</title>'+line('ALURA',62,4,52,'#f4edff')+line('IREZUMI',22,7,82,'#03d8f4')+'</svg>'
(ROOT/'public/brand/alura-wordmark.svg').write_text(svg)
license_path=ROOT/'node_modules/@fontsource/barlow-condensed/LICENSE'
if license_path.exists():(ROOT/'public/brand/Barlow-OFL.txt').write_text(license_path.read_text())
