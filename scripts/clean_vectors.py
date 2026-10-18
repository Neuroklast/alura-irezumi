"""Normalize trusted vector assets and trim the viewBox to painted geometry."""
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from fontTools.svgLib.path.parser import parse_path
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

ROOT=Path(__file__).resolve().parents[1]
NS='http://www.w3.org/2000/svg'
ET.register_namespace('',NS)

def clean(path):
    tree=ET.parse(path);root=tree.getroot();bounds=BoundsPen(None)
    for element in root.iter('{'+NS+'}path'):
        transform=element.attrib.get('transform','')
        if transform:
            match=re.fullmatch(r'translate\(([-\d.]+)[, ]+([-\d.]+)\)',transform)
            if not match:raise ValueError('Unsupported path transform: '+transform)
            x,y=map(float,match.groups());pen=TransformPen(bounds,(1,0,0,1,x,y))
        else:pen=bounds
        parse_path(element.attrib['d'],pen)
    x0,y0,x1,y1=bounds.bounds
    pad=3
    root.set('viewBox',f'{x0-pad:.2f} {y0-pad:.2f} {x1-x0+2*pad:.2f} {y1-y0+2*pad:.2f}')
    root.set('preserveAspectRatio','xMidYMid meet')
    root.attrib.pop('width',None);root.attrib.pop('height',None)
    title=root.find('{'+NS+'}title')
    if title is None:title=ET.SubElement(root,'{'+NS+'}title')
    title.set('id','title');root.set('aria-labelledby','title');root.attrib.pop('aria-label',None)
    title.text=({'marowak':'Alola-Knogga','mew':'Mew','espeon':'Psiana','vaporeon':'Aquana'}[path.stem])+' – Wannado von ALURA IREZUMI'
    # Keep only the artist's black contour layer, with unpainted space transparent.
    for parent in root.iter():
        for child in list(parent):
            if child.get('data-layer')=='shade':parent.remove(child)
    for element in root.iter():
        if element.tag in ['{'+NS+'}path','{'+NS+'}g']:
            element.set('fill','#000000')
            element.attrib.pop('fill-opacity',None)
            element.attrib.pop('opacity',None)
    tree.write(path,encoding='unicode')
    # Mirror engraving is a material rendering of the same contours, not tattoo ink.
    for element in root.iter():
        if element.tag in ['{'+NS+'}path','{'+NS+'}g']:
            element.set('fill','#e9efff')
    tree.write(path.with_name(path.stem+'-engraving.svg'),encoding='unicode')
    return list(bounds.bounds)

if __name__=='__main__':
    for key in ['mew','espeon','marowak','vaporeon']:
        print(key,clean(ROOT/'public/art'/f'{key}.svg'))
