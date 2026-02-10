# 🚀 Guía de Lanzamiento a Producción - Santo Dilema

## ✅ Estado Actual

### Datos Limpiados
- ✅ **Pedidos locales**: LIMPIADOS (0 pedidos)
- ✅ **Clientes locales**: LIMPIADOS (derivados de pedidos)
- ✅ **Compras/Gastos**: PRESERVADOS (1 registro)
- ✅ **Productos de Venta**: PRESERVADOS (14 productos)

### Pendiente
- ⏳ **Limpieza en Producción (Vercel)**: Ejecutar después del deploy
- 📝 **Eliminar endpoint de limpieza**: Después de limpiar producción
- 🌐 **Configurar dominio**: www.santodilema.com

---

## 📋 PASO 1: Limpiar Base de Datos de Producción

**⚠️ IMPORTANTE**: El deploy de Vercel debe estar completado antes de ejecutar esto.

### Verificar que el deploy esté listo:
```bash
curl https://santo-dilema.vercel.app/api/version
```

Si responde con JSON (versión del sistema), el deploy está listo.

### Ejecutar limpieza en producción:
```bash
cd santo-dilema
node scripts/clear-test-data.js
```

Cuando te pida confirmación, escribe: **SI**

El script mostrará:
- 🗑️ Cantidad de pedidos eliminados
- ✅ Cantidad de compras/gastos preservados
- ✅ Cantidad de productos preservados

---

## 📋 PASO 2: Eliminar Endpoint de Limpieza

**Después de confirmar que la limpieza fue exitosa:**

```bash
cd santo-dilema
git rm app/api/clear-orders/route.ts
git rm scripts/clear-test-data.js
git commit -m "chore: Eliminar endpoint temporal de limpieza"
git push
```

Esto asegura que el endpoint de limpieza no exista en producción final.

---

## 📋 PASO 3: Configurar Dominio en Namecheap

### En Namecheap (www.santodilema.com):

1. **Ir a:** Dashboard → Domain List → santodilema.com → Manage

2. **Advanced DNS** → Agregar estos registros:

| Type  | Host | Value                 | TTL       |
|-------|------|-----------------------|-----------|
| CNAME | www  | cname.vercel-dns.com  | Automatic |
| A     | @    | 76.76.21.21           | Automatic |

3. **Guardar cambios**

⏰ **Propagación DNS**: 5 minutos a 48 horas (usualmente 1-2 horas)

---

## 📋 PASO 4: Configurar Dominio en Vercel

### En Vercel Dashboard:

1. **Ir a:** https://vercel.com/dashboard
2. **Seleccionar proyecto:** santo-dilema
3. **Settings** → **Domains**
4. **Add Domain:**
   - Agregar: `santodilema.com`
   - Agregar: `www.santodilema.com`

5. **Verificar configuración DNS:**
   - Vercel te mostrará si los registros DNS están correctos
   - Esperar a que muestre checkmarks verdes

6. **Configurar dominio principal:**
   - Hacer que `www.santodilema.com` sea el dominio principal
   - `santodilema.com` redirigirá automáticamente a `www.santodilema.com`

---

## 📋 PASO 5: Variables de Entorno en Vercel

### Verificar que estén configuradas:

**Settings** → **Environment Variables**

Variables requeridas:
```
✅ UPSTASH_REDIS_REST_URL
✅ UPSTASH_REDIS_REST_TOKEN
✅ CLOUDINARY_CLOUD_NAME
✅ CLOUDINARY_API_KEY
✅ CLOUDINARY_API_SECRET
✅ ADMIN_PASSWORD
```

Si falta alguna, agregarla en Vercel y hacer redeploy.

---

## 💰 PLANES Y COSTOS

### Plan Vercel - Hobby (GRATIS) ✅ SUFICIENTE

**Tu uso estimado:**
- 🗓️ **Operación**: Jueves a Domingo (4 días/semana)
- 👥 **Tráfico**: ~50 personas/día = 200 visitas/semana
- 📦 **Pedidos**: ~10-20 pedidos/día = 40-80 pedidos/semana

**Límites del Plan Hobby (Free):**
- ✅ **Bandwidth**: 100 GB/mes (necesitas <1 GB)
- ✅ **Function Execution**: 100 GB-hrs (necesitas <0.5 GB-hrs)
- ✅ **Requests**: Ilimitados
- ✅ **Builds**: 6,000 minutos/mes (necesitas <10 min/mes)
- ✅ **Dominios personalizados**: Incluidos
- ✅ **SSL automático**: Incluido

**CONCLUSIÓN**: No necesitas plan pagado. El plan gratuito cubre perfectamente tu operación.

### Plan Pro ($20/mes) - NO NECESARIO

Solo considerarlo si:
- Creces a más de 1,000 visitas/día
- Necesitas múltiples miembros en el equipo
- Requieres analytics avanzados

---

## 📊 MONITOREO POST-LANZAMIENTO

### Primeras 24 horas:

1. **Verificar funcionamiento:**
   - ✅ Página FAT carga correctamente
   - ✅ Página FIT carga correctamente
   - ✅ Checkout funciona
   - ✅ Panel Admin accesible con contraseña
   - ✅ Pedidos se guardan en Upstash Redis
   - ✅ Comprobantes de pago suben a Cloudinary

2. **Probar flujo completo:**
   - Hacer un pedido de prueba real
   - Verificar que llegue al admin
   - Confirmar pedido
   - Marcar como "en camino"
   - Marcar como "entregado"
   - Verificar que el dashboard actualice las métricas

3. **Monitorear errores en Vercel:**
   - Dashboard → Deployments → (último deploy) → Logs
   - Revisar si hay errores 500 o warnings

---

## 🔒 SEGURIDAD

### Contraseñas:
- ✅ **Admin**: Configurada en variable de entorno
- ⚠️ **Cambiar después del lanzamiento** si se ha compartido durante pruebas

### Recomendaciones:
1. No compartir la URL del admin públicamente
2. Usar navegación privada si accedes desde computadoras públicas
3. Cerrar sesión después de usar el admin
4. Cambiar contraseña periódicamente (mensual)

---

## 📱 ACCESOS RÁPIDOS POST-LANZAMIENTO

| Servicio | URL | Uso |
|----------|-----|-----|
| **Web pública** | https://www.santodilema.com | Clientes hacen pedidos |
| **Admin** | https://www.santodilema.com/admin | Gestión de pedidos |
| **Delivery** | https://www.santodilema.com/delivery | Vista de repartidor |
| **Vercel Dashboard** | https://vercel.com/dashboard | Monitoreo y deploys |
| **Cloudinary** | https://cloudinary.com/console | Comprobantes de pago |
| **Upstash** | https://console.upstash.com | Base de datos |

---

## 🆘 TROUBLESHOOTING

### Problema: "Database not configured"
**Solución**: Verificar variables `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` en Vercel → Settings → Environment Variables

### Problema: Dominio no carga
**Solución**:
1. Verificar propagación DNS: https://dnschecker.org
2. Revisar registros en Namecheap Advanced DNS
3. Verificar configuración en Vercel → Settings → Domains

### Problema: Comprobantes no se suben
**Solución**: Verificar variables `CLOUDINARY_*` en Vercel

### Problema: No puedo acceder al admin
**Solución**:
1. Verificar variable `ADMIN_PASSWORD` en Vercel
2. URL debe ser: `/admin` (no `/admin/login` directamente)

---

## ✅ CHECKLIST FINAL PRE-LANZAMIENTO

- [ ] Limpieza de producción ejecutada exitosamente
- [ ] Endpoint de limpieza eliminado y redeployado
- [ ] Dominio configurado en Namecheap
- [ ] Dominio agregado en Vercel
- [ ] DNS propagado (verificar con dnschecker.org)
- [ ] SSL activo (candado verde en navegador)
- [ ] Variables de entorno verificadas
- [ ] Pedido de prueba realizado exitosamente
- [ ] Dashboard financiero muestra datos correctos
- [ ] Compras y productos preservados correctamente
- [ ] Contraseña de admin actualizada (si es necesario)

---

## 🎉 LANZAMIENTO

Una vez completados todos los pasos del checklist:

**¡Santo Dilema está listo para producción!**

Compartir el enlace con clientes: **https://www.santodilema.com**

---

## 📞 SOPORTE TÉCNICO

Si encuentras algún problema durante el lanzamiento:
- Revisar logs en Vercel Dashboard
- Verificar consola del navegador (F12) para errores
- Revisar esta guía paso a paso

**Fecha de preparación**: 10 de Febrero, 2026
**Versión del sistema**: 2.9.0 (Dashboard Financiero Integrado)
