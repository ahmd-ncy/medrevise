# Régénère index.html et sw.js à partir des fichiers présents.
# À lancer après avoir ajouté, retiré ou renommé un fichier : python3 build.py
import os, hashlib
R = os.path.dirname(os.path.abspath(__file__))
js = sorted(f for f in os.listdir(os.path.join(R, "js")) if f.endswith(".js"))
import re
cfg = open(os.path.join(R, "js", "00-config.js")).read()
sb = re.search(r'SB_URL = "([^"]+)"', cfg).group(1)
csp = ("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
       "font-src https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self' " + sb + " " + sb.replace("https", "wss") + " data: blob:; "
       "worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'; manifest-src 'self'")
html = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="""+'"'+csp+'"'+""">
<meta name="referrer" content="no-referrer">
<title>MedRevise</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#2d4876">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="MedRevise">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icons/favicon.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;800&family=Source+Serif+4:wght@600;700&display=swap">
<link rel="stylesheet" href="css/app.css">
<script defer src="vendor/pdf.min.js"></script>
<script src="vendor/supabase.js"></script>
</head>
<body>
<header id="top"></header>
<main id="app"></main>
<!-- Modules chargés dans l'ordre : 99-demarrage.js lance l'application. -->
""" + "".join('<script src="js/%s"></script>\n' % f for f in js) + """</body>
</html>
"""
open(os.path.join(R, "index.html"), "w").write(html)
files = ["./", "index.html", "manifest.webmanifest", "css/app.css"] + ["js/" + f for f in js] + \
    ["vendor/" + f for f in sorted(os.listdir(os.path.join(R, "vendor")))] + \
    ["icons/" + f for f in sorted(os.listdir(os.path.join(R, "icons")))]
h = hashlib.sha1()
for f in files[1:]:
    h.update(open(os.path.join(R, f), "rb").read())
sw = open(os.path.join(R, "sw.template.js")).read().replace("__VERSION__", h.hexdigest()[:10]).replace(
    "__FILES__", ",\n  ".join('"%s"' % f for f in files))
open(os.path.join(R, "sw.js"), "w").write(sw)
print(len(js), "modules, version", h.hexdigest()[:10])
