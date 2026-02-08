# 🚀 GUÍA DE PRODUCCIÓN - SANTO DILEMA

## ✅ CONFIGURACIÓN COMPLETADA

### 📊 Tráfico Estimado
- **40 personas/día** → Plan GRATUITO de Vercel es PERFECTO
- Sin costo mensual
- Más que suficiente capacidad

---

## 🔐 CREDENCIALES DE ACCESO

### Panel de Administración
- **URL**: https://santodilema.com/admin/login
- **Usuario**: (configurar en variables de entorno)
- **Contraseña**: (configurar en variables de entorno)

---

## ⚙️ VARIABLES DE ENTORNO EN VERCEL

```bash
# Credenciales Admin
ADMIN_USERNAME=santoadmin
ADMIN_PASSWORD=SantoDilema2025!Segura

# Base de datos (se configuran automáticamente desde Storage)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Entorno
NODE_ENV=production
```

---

## 🌐 CONFIGURACIÓN DNS (Namecheap)

### Registros DNS para santodilema.com

| Tipo   | Host | Valor                  | TTL       |
|--------|------|------------------------|-----------|
| A      | @    | 76.76.21.21           | Automatic |
| CNAME  | www  | cname.vercel-dns.com  | Automatic |

⏱️ **Propagación**: 5-30 minutos

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
santo-dilema/
├── app/
│   ├── admin/          # Panel de administración
│   ├── api/            # APIs del servidor
│   ├── checkout/       # Página de pago
│   ├── fat/            # Menú Placer (Wings)
│   └── fit/            # Menú Balance (Ensaladas)
├── public/
│   ├── vouchers/       # Comprobantes de pago (ignorados en Git)
│   ├── banner*.png     # Banners promocionales
│   └── logoprincipal.png
└── lib/
    └── storage.ts      # Conexión a base de datos
```

---

## 🎯 URLS DE PRODUCCIÓN

- **Página principal**: https://santodilema.com
- **Menú Placer (Wings)**: https://santodilema.com/fat
- **Menú Balance (Ensaladas)**: https://santodilema.com/fit
- **Panel Admin**: https://santodilema.com/admin/login

---

## 📝 FUNCIONALIDADES

### Para Clientes:
✅ Ver menús (Wings y Ensaladas)
✅ Seleccionar productos con salsas
✅ Agregar complementos (bebidas, extras)
✅ Carrito de compras
✅ Checkout con datos personales
✅ Métodos de pago (Yape, Plin, Efectivo)
✅ Subir comprobante de pago

### Para Administración:
✅ Login seguro
✅ Ver todos los pedidos
✅ Gestionar inventario
✅ Ver productos
✅ Registrar deducciones
✅ Cierre diario
✅ Gestión de clientes
✅ Promociones

---

## 🔧 MANTENIMIENTO

### Actualizar Contenido
1. Hacer cambios en código local
2. Commit y push a GitHub
3. Vercel despliega automáticamente (si no hay límite de deployments)

### Backup de Datos
- Los datos están en Upstash Redis
- Se recomienda exportar pedidos cada semana desde el panel admin

### Monitoreo
- Dashboard Vercel: https://vercel.com/dashboard
- Ver analytics y errores en tiempo real

---

## 🆘 SOPORTE

### Problemas Comunes

**1. "No se guardan los pedidos"**
- Verificar que Upstash esté conectado en Vercel Storage
- Revisar logs en Vercel Dashboard

**2. "No puedo acceder al admin"**
- Verificar variables ADMIN_USERNAME y ADMIN_PASSWORD en Vercel
- Limpiar localStorage del navegador

**3. "El dominio no funciona"**
- Esperar 30 min para propagación DNS
- Verificar registros en Namecheap Advanced DNS

---

## 💰 COSTOS (Con 40 visitas/día)

- **Vercel Hosting**: $0/mes (plan gratuito)
- **Upstash Redis**: $0/mes (plan gratuito)
- **Dominio**: ~$15/año (ya pagado en Namecheap)
- **TOTAL MENSUAL**: $0 USD 🎉

---

Creado: $(date)
