# Construit la version publiée de MedRevise. À lancer après chaque modification : python3 build.py
# - index.html : version publiée (un seul fichier JS et un seul CSS, compressés) ;
# - dev.html   : version de développement (les modules un par un, non compressés) ;
# - sw.js      : fonctionnement hors connexion, avec la liste des fichiers de la version.
# Outils nécessaires : node avec terser et esbuild (npm i terser esbuild), cherchés dans TOOLS ou dans le PATH.
import os, re, hashlib, subprocess, glob, shutil

R = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.environ.get("MR_TOOLS", "/home/claude/mr/node_modules/.bin")


def tool(name):
    p = os.path.join(TOOLS, name)
    return p if os.path.exists(p) else shutil.which(name)


P = lambda *a: os.path.join(R, *a)
js = sorted(f for f in os.listdir(P("js")) if f.endswith(".js") and f != "00-version.js")

# numéro de version : empreinte du code et des styles
h = hashlib.sha1()
for f in js:
    h.update(open(P("js", f), "rb").read())
h.update(open(P("css", "app.css"), "rb").read())
APPV = h.hexdigest()[:7]
open(P("js", "00-version.js"), "w").write(
    '// Généré par build.py : numéro de la version publiée.\nconst APPV = "%s";\n' % APPV
)
js = sorted(js + ["00-version.js"])

# politique de sécurité du contenu
cfg = open(P("js", "00-config.js")).read()
sb = re.search(r'SB_URL = "([^"]+)"', cfg).group(1)
csp = (
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self' "
    + sb + " " + sb.replace("https", "wss") + " data: blob:; "
    "worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'; manifest-src 'self'"
)

# fichiers compressés
for old in glob.glob(P("app.*.min.js")) + glob.glob(P("css", "app.*.min.css")):
    os.remove(old)
bundle = "\n;\n".join(open(P("js", f)).read() for f in js)
JSF, CSSF = "app.%s.min.js" % APPV, "css/app.%s.min.css" % APPV
open(P("_bundle.js"), "w").write(bundle)
subprocess.run([tool("terser"), P("_bundle.js"), "-c", "-m", "--comments", "false", "-o", P(JSF)], check=True)
os.remove(P("_bundle.js"))
subprocess.run([tool("esbuild"), P("css", "app.css"), "--minify", "--log-level=warning", "--outfile=" + P(CSSF)], check=True)


def page(css, scripts):
    return (
        """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<base href="/">
<meta http-equiv="Content-Security-Policy" content=\"""" + csp + """\">
<meta name="referrer" content="no-referrer">
<title>MedRevise</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="MedRevise, ton outil de révision n°1 : cours, QCM, flashcards et planning.">
<meta name="theme-color" content="#0b1430">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="MedRevise">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icons/favicon.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="preload" href="fonts/inter-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/inter-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>html{background:#0b1430}</style>
<link rel="stylesheet" href=\"""" + css + """\">
</head>
<body>
<header id="top"></header>
<main id="app"></main>
<script src="vendor/supabase.js"></script>
""" + "".join('<script src="%s"></script>\n' % s for s in scripts) + """</body>
</html>
"""
    )


open(P("index.html"), "w").write(page(CSSF, [JSF]))
# GitHub Pages sert 404.html pour toute adresse inconnue (/cours, /planning…) : l'app lit l'adresse et affiche la bonne page
open(P("404.html"), "w").write(page(CSSF, [JSF]))
open(P("dev.html"), "w").write(page("css/app.css", ["js/" + f for f in js]))

# service worker : fichiers gardés pour le hors connexion (pdf.js est mis en cache au premier usage)
files = ["./", "index.html", "manifest.webmanifest", CSSF, JSF, "vendor/supabase.js"] + \
    ["fonts/" + f for f in sorted(os.listdir(P("fonts")))] + ["icons/" + f for f in sorted(os.listdir(P("icons")))]
sw = open(P("sw.template.js")).read().replace("__VERSION__", APPV).replace(
    "__FILES__", ",\n  ".join('"%s"' % f for f in files))
open(P("sw.js"), "w").write(sw)
print("version", APPV, "·", os.path.getsize(P(JSF)) // 1024, "Ko de JS,", os.path.getsize(P(CSSF)) // 1024, "Ko de CSS")
