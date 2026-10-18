"""Trace the four supplied ALURA flash designs. Requires Pillow, numpy, OpenCV, vtracer.
Usage: python scripts/vectorize_posts.py /path/to/upload
The source Instagram UI is excluded. Outputs contain vector paths only.
"""
from pathlib import Path
import sys,json
import numpy as np
from PIL import Image,ImageOps,ImageDraw
import cv2,vtracer,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]; source=Path(sys.argv[1]); tmp=Path('/tmp/alura-vector-qa');tmp.mkdir(exist_ok=True)
items=[('mew','image(20261018-102613).png',(88,124,450,1021),'Mew'),('espeon','image(20261018-102613).png',(430,114,799,1045),'Psiana'),('marowak','Screenshot 2026-10-18 122536.png',(17,23,385,962),'Alola-Knogga'),('vaporeon','Screenshot 2026-10-18 122536.png',(416,78,839,1130),'Aquana')]
ns='{http://www.w3.org/2000/svg}'
manifest=[]
for key,file,box,title in items:
 im=Image.open(source/file).convert('RGB').crop(box);arr=np.array(im).astype(float);hi=arr.max(2);sat=hi-arr.min(2)
 # Neutral black ink and grey shading survive; saturated post backgrounds do not.
 # Use the connected outline of the design to exclude the post background.
 ink=((hi<125)&(sat<37)).astype('uint8')*255
 count,labels,stats,_=cv2.connectedComponentsWithStats(ink,8)
 principal=1+np.argmax(stats[1:,cv2.CC_STAT_AREA])
 main=(labels==principal)
 envelope=np.zeros_like(ink)
 for y in range(ink.shape[0]):
  xs=np.where(main[y])[0]
  if len(xs):envelope[y,max(0,xs.min()-8):min(ink.shape[1],xs.max()+9)]=255
 envelope=cv2.dilate(envelope,np.ones((7,3),np.uint8))>0
 denoised=cv2.medianBlur(np.array(im),5).astype(float);dhi=denoised.max(2);dsat=dhi-denoised.min(2)
 shade=((dhi<218)&(dsat<60)&envelope).astype('uint8')*255
 shade=cv2.morphologyEx(shade,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))
 if key=='marowak':
  envelope[175:430,78:360]=True
  gray=cv2.cvtColor(np.array(im),cv2.COLOR_RGB2GRAY)
  shade=cv2.adaptiveThreshold(gray,255,cv2.ADAPTIVE_THRESH_GAUSSIAN_C,cv2.THRESH_BINARY_INV,31,10)
  shade[~((sat<45)&(hi<235)&envelope)]=0
 else:
  top,bottom={'mew':(200,480),'espeon':(110,500),'vaporeon':(130,670)}[key]
  shade[:top]=0;shade[bottom:]=0
 masks=[('shade',(shade>0)&envelope,'#a8a3ab'),('ink',(ink>0)&envelope,'#17121e')]
 layers=[]
 for layer,mask,color in masks:
  mask=mask.astype('uint8')*255
  count,labels,stats,_=cv2.connectedComponentsWithStats(mask,8)
  cleaned=np.zeros_like(mask)
  for i in range(1,count):
   if stats[i,cv2.CC_STAT_AREA]>=5:cleaned[labels==i]=255
  path=tmp/f'{key}-{layer}.png';Image.fromarray(255-cleaned).save(path)
  output=tmp/f'{key}-{layer}.svg'
  vtracer.convert_image_to_svg_py(str(path),str(output),colormode='binary',mode='spline',filter_speckle=4,corner_threshold=60,length_threshold=3.5,max_iterations=10,splice_threshold=45,path_precision=2)
  traced=ET.parse(output).getroot();paths=[]
  for element in list(traced):
   if element.tag.endswith('path'):
    element.set('fill',color);paths.append(ET.tostring(element,encoding='unicode').replace('ns0:','').replace(':ns0',''))
  layers.append('<g data-layer="'+layer+'">'+''.join(paths)+'</g>')
 w,h=im.size
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-labelledby="title"><title id="title">{title} – Wannado von ALURA IREZUMI</title><desc>Aus dem bereitgestellten Instagram-Post vektorisierter Entwurf. Kein Foto eines ausgeführten Tattoos.</desc>'+''.join(layers)+'</svg>'
 (root/'public/art'/f'{key}.svg').write_text(svg)
 im.save(tmp/f'{key}-source.png')
 manifest.append({'file':f'{key}.svg','title':title,'source':file,'crop':box,'method':'two-layer neutral-ink vector trace','artist':'ALURA IREZUMI','kind':'Wannado / design, not an executed tattoo'})
(root/'public/art/provenance.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
# Original portrait, compressed for the site; remove the Instagram overlay at the bottom.
im=Image.open(source/'image(20261018-102802).png').convert('RGB');im.crop((0,0,im.width,im.height-100)).save(root/'public/art/laura-atelier.webp',quality=88)

# Recompute tightly fitted viewBoxes after tracing.
from clean_vectors import clean
for key, *_ in items:clean(root/"public/art"/f"{key}.svg")
