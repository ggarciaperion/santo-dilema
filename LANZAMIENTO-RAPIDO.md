# 🚀 Lanzamiento Rápido - 5 Pasos

## 1️⃣ Ejecutar Limpieza en Producción (5 min)

```bash
cd santo-dilema
node scripts/clear-test-data.js
```
Escribe: **SI** cuando te lo pida

---

## 2️⃣ Eliminar Script de Limpieza (2 min)

```bash
git rm app/api/clear-orders/route.ts
git rm scripts/clear-test-data.js
git commit -m "chore: Eliminar endpoint temporal"
git push
```

---

## 3️⃣ Configurar DNS en Namecheap (5 min)

**Namecheap → santodilema.com → Manage → Advanced DNS**

Agregar:
- **CNAME** | `www` → `cname.vercel-dns.com`
- **A Record** | `@` → `76.76.21.21`

---

## 4️⃣ Agregar Dominio en Vercel (3 min)

**Vercel → santo-dilema → Settings → Domains**

Agregar:
- `santodilema.com`
- `www.santodilema.com` (principal)

---

## 5️⃣ Verificar (10 min)

- ✅ Abrir: https://www.santodilema.com
- ✅ Hacer pedido de prueba
- ✅ Verificar en admin que llegó
- ✅ Revisar dashboard financiero

---

## ✅ ¡Listo para producción!

**Plan Vercel necesario**: GRATIS (Hobby) ✅

Con 50 personas/día, el plan gratuito es más que suficiente.

---

📖 **Guía completa**: Ver `PRODUCTION-LAUNCH.md`
