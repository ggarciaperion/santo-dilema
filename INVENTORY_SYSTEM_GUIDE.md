# 🏭 Sistema de Inventario Avanzado - Santo Dilema

## 📋 Índice
1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura)
3. [Características Principales](#características)
4. [Estructura de Datos](#estructura-de-datos)
5. [APIs Disponibles](#apis)
6. [Uso del Sistema](#uso)
7. [Flujos de Trabajo](#flujos)

---

## 🎯 Visión General

Sistema de inventario empresarial de nivel profesional diseñado para Santo Dilema. Incluye:

- **Control Total de Inventario**: Seguimiento en tiempo real de todos los artículos
- **Gestión de Compras**: Órdenes de compra completas con múltiples proveedores
- **Sistema de Proveedores**: Base de datos de proveedores con historial y calificaciones
- **Movimientos de Inventario**: Registro completo de entradas, salidas, ajustes y mermas
- **Analytics Avanzado**: Análisis ABC, rotación de inventario, tendencias de costos
- **Sugerencias Automáticas**: Sistema inteligente de reorden basado en consumo histórico
- **Valorización de Stock**: Cálculos automáticos con método FIFO y costo promedio

---

## 🏗️ Arquitectura

### Estructura de Archivos

```
santo-dilema/
├── types/
│   └── inventory.ts                    # 🎯 Definiciones TypeScript completas
├── app/
│   ├── api/
│   │   └── inventory-v2/
│   │       ├── items/route.ts          # API de Artículos
│   │       ├── suppliers/route.ts      # API de Proveedores
│   │       ├── purchases/route.ts      # API de Compras
│   │       ├── movements/route.ts      # API de Movimientos
│   │       └── analytics/route.ts      # API de Analytics
│   └── admin-inventory/
│       └── page.tsx                    # Panel de Control Principal
├── components/
│   └── inventory/
│       └── Constants.ts                # Constantes y Labels
└── data/
    ├── inventory-items.json            # Items de inventario
    ├── suppliers.json                  # Proveedores
    ├── purchases.json                  # Órdenes de compra
    └── inventory-movements.json        # Movimientos
```

---

## ✨ Características Principales

### 1. 📦 Gestión de Artículos (Inventory Items)

**Campos Principales:**
- ✅ Nombre y SKU (generación automática)
- ✅ Categoría (13 categorías: proteínas, vegetales, frutas, etc.)
- ✅ Unidad de medida (15 opciones: kg, g, l, unidades, paquetes, etc.)
- ✅ Conversiones de unidades (ej: 1 paquete = 10 unidades)
- ✅ Stock actual, mínimo, máximo y punto de reorden
- ✅ Costos: último costo y costo promedio (cálculo automático)
- ✅ Proveedores: preferido y alternativos
- ✅ Perecibilidad: flag + vida útil en días
- ✅ Ubicación de almacenamiento
- ✅ Estado activo/inactivo

**Funcionalidades:**
- Búsqueda por nombre o SKU
- Filtros por categoría, estado, stock bajo
- Alertas automáticas de stock crítico
- Cálculo automático de costos promedio
- Sugerencias de reorden inteligentes

### 2. 🏢 Gestión de Proveedores

**Campos Principales:**
- ✅ Datos de contacto completos (nombre, RUC, teléfono, email)
- ✅ Categorías de productos que suministra
- ✅ Términos de pago (contado, 15 días, 30 días, etc.)
- ✅ Cuenta bancaria
- ✅ Calificación (1-5 estrellas)
- ✅ Estadísticas: total comprado, última compra
- ✅ Notas y observaciones

**Funcionalidades:**
- Historial completo de compras por proveedor
- Análisis de desempeño
- Comparación de precios entre proveedores
- Contacto rápido (teléfono/email)

### 3. 🛒 Órdenes de Compra (Purchase Orders)

**Campos Principales:**
- ✅ Número de OC automático (PO-2024-0001)
- ✅ Proveedor con datos completos
- ✅ Fechas: compra, entrega esperada, entrega real
- ✅ Items múltiples con:
  - Artículo, cantidad, unidad
  - Costo unitario y total
  - Descuentos por ítem
  - Lote/batch y fecha de vencimiento
  - Cantidad recibida vs ordenada
- ✅ Cálculos automáticos:
  - Subtotal
  - IGV (18% configurable)
  - Descuentos
  - Envío
  - Otros cargos
  - Total
- ✅ Estados: Borrador → Pedido → Recibido/Parcial
- ✅ Estado de pago: Pendiente → Parcial → Pagado → Vencido
- ✅ Método de pago
- ✅ Monto pagado y pendiente
- ✅ Carga de factura y comprobante de pago
- ✅ Notas públicas e internas

**Funcionalidades:**
- Al recibir la orden, actualiza automáticamente el inventario
- Crea movimientos de inventario automáticos
- Actualiza costos promedio de los artículos
- Tracking de lotes y fechas de vencimiento
- Alertas de pagos vencidos
- Reportes de compras por período/proveedor

### 4. 📋 Movimientos de Inventario

**Tipos de Movimientos:**
1. **Compra** - Entrada por orden de compra
2. **Venta** - Salida por venta a cliente
3. **Ajuste** - Correcciones de inventario
4. **Merma** - Desperdicios y pérdidas
5. **Devolución** - Devoluciones a proveedor
6. **Transferencia** - Entre ubicaciones
7. **Producción** - Uso en preparación de productos

**Campos:**
- ✅ Número de movimiento único (MOV-2024-000001)
- ✅ Tipo de movimiento
- ✅ Artículo afectado
- ✅ Cantidad y unidad
- ✅ Entrada/Salida (flag)
- ✅ Lote/batch (si aplica)
- ✅ Costo unitario y total
- ✅ Stock antes y después
- ✅ Referencia (ID de orden de compra, venta, etc.)
- ✅ Razón del movimiento
- ✅ Usuario que realizó el movimiento
- ✅ Timestamp

**Funcionalidades:**
- Registro automático desde compras y ventas
- Movimientos manuales (ajustes, mermas)
- Auditoría completa de cambios de stock
- Trazabilidad por lote
- Reportes de mermas y desperdicios

### 5. 📊 Analytics y Reportes

#### Dashboard General
- Total de artículos y valor del inventario
- Items con stock crítico, bajo y agotados
- Compras y mermas del mes
- Proveedores activos
- Movimientos recientes
- Órdenes de compra pendientes

#### Análisis Completo
- **Rotación de Inventario**
  - Ratio de rotación
  - Días de inventario disponible

- **Análisis ABC**
  - Categoría A: 80% del valor, 20% de items
  - Categoría B: 15% del valor, 30% de items
  - Categoría C: 5% del valor, 50% de items

- **Top Productos**
  - Más vendidos
  - Menos vendidos (slow-moving)
  - Items próximos a vencer

- **Análisis de Proveedores**
  - Top proveedores por volumen
  - Desempeño de entregas
  - Comparación de precios

- **Tendencias de Costos**
  - Evolución de precios por artículo
  - Variaciones porcentuales
  - Alertas de incrementos significativos

#### Sugerencias de Reorden
Algoritmo inteligente que calcula:
- Consumo diario promedio (últimos 30 días)
- Lead time de entrega (7 días por defecto)
- Stock de seguridad (7 días de consumo)
- Cantidad sugerida de pedido
- Costo estimado
- Nivel de urgencia (crítico/alto/medio/bajo)
- Proveedor recomendado

#### Valorización de Stock
- Método FIFO (First In First Out)
- Método de Costo Promedio
- Valor total del inventario
- Valor por categoría
- Valor por ubicación

---

## 📊 Estructura de Datos

### InventoryItem (Artículo de Inventario)

```typescript
{
  id: string;
  name: string;
  sku: string;                    // Generado automáticamente
  category: ItemCategory;
  unit: UnitOfMeasure;

  // Conversiones
  unitConversions: [
    { fromUnit: "paquete", toUnit: "unidad", factor: 10 }
  ];

  // Stock
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;

  // Costos
  lastCost: number;               // Último precio de compra
  averageCost: number;            // Costo promedio ponderado

  // Proveedores
  preferredSupplier: string;      // ID
  alternativeSuppliers: string[]; // IDs

  // Perecibilidad
  isPerishable: boolean;
  shelfLifeDays: number;

  // Ubicación
  storageLocation: string;

  // Metadata
  active: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
```

### PurchaseOrder (Orden de Compra)

```typescript
{
  id: string;
  purchaseNumber: string;         // PO-2024-0001

  supplier: {
    id: string;
    name: string;
    ruc: string;
  };

  // Fechas
  purchaseDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate: string;

  // Items
  items: [
    {
      inventoryItemId: string;
      itemName: string;
      category: ItemCategory;
      quantity: number;
      unit: UnitOfMeasure;
      unitCost: number;
      subtotal: number;
      discount: number;
      total: number;
      batchNumber: string;
      expirationDate: string;
      receivedQuantity: number;
      receivedDate: string;
      notes: string;
    }
  ];

  // Montos
  subtotal: number;
  taxRate: number;                // 18%
  taxAmount: number;
  discount: number;
  shipping: number;
  otherCharges: number;
  total: number;

  // Estados
  status: PurchaseStatus;         // draft | ordered | received | partial | cancelled
  paymentStatus: PaymentStatus;   // pending | partial | paid | overdue
  paymentMethod: PaymentMethod;

  // Pagos
  paidAmount: number;
  pendingAmount: number;
  paymentDueDate: string;

  // Documentos
  invoiceNumber: string;
  invoicePath: string;
  receiptPath: string;

  // Notas
  notes: string;
  internalNotes: string;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  receivedBy: string;
  receivedAt: string;
}
```

---

## 🔌 APIs Disponibles

### 1. Items API (`/api/inventory-v2/items`)

#### GET - Listar artículos
```
GET /api/inventory-v2/items
GET /api/inventory-v2/items?category=proteinas
GET /api/inventory-v2/items?active=true
GET /api/inventory-v2/items?lowStock=true
GET /api/inventory-v2/items?search=pollo
```

#### POST - Crear artículo
```json
{
  "name": "Pechuga de Pollo",
  "category": "proteinas",
  "unit": "kg",
  "currentStock": 0,
  "minStock": 10,
  "maxStock": 50,
  "reorderPoint": 15,
  "lastCost": 12.50,
  "isPerishable": true,
  "shelfLifeDays": 7
}
```

#### PATCH - Actualizar artículo
```json
{
  "id": "1234567890",
  "currentStock": 25,
  "lastCost": 13.00
}
```

#### DELETE - Eliminar artículo
```
DELETE /api/inventory-v2/items?id=1234567890
```

### 2. Suppliers API (`/api/inventory-v2/suppliers`)

#### GET - Listar proveedores
```
GET /api/inventory-v2/suppliers
GET /api/inventory-v2/suppliers?active=true
GET /api/inventory-v2/suppliers?category=proteinas
GET /api/inventory-v2/suppliers?withStats=true
```

#### POST - Crear proveedor
```json
{
  "name": "Distribuidora San Juan",
  "ruc": "20123456789",
  "contactName": "Juan Pérez",
  "phone": "987654321",
  "email": "ventas@sanjuan.com",
  "category": ["proteinas", "vegetales"],
  "paymentTerms": "15 días",
  "active": true
}
```

### 3. Purchases API (`/api/inventory-v2/purchases`)

#### GET - Listar órdenes de compra
```
GET /api/inventory-v2/purchases
GET /api/inventory-v2/purchases?status=received
GET /api/inventory-v2/purchases?supplierId=123
GET /api/inventory-v2/purchases?from=2024-01-01&to=2024-01-31
```

#### POST - Crear orden de compra
```json
{
  "supplier": {
    "id": "123",
    "name": "Distribuidora San Juan"
  },
  "purchaseDate": "2024-01-15",
  "items": [
    {
      "inventoryItemId": "456",
      "itemName": "Pechuga de Pollo",
      "category": "proteinas",
      "quantity": 20,
      "unit": "kg",
      "unitCost": 12.50,
      "subtotal": 250.00,
      "discount": 0,
      "total": 250.00,
      "batchNumber": "LOT-2024-001",
      "expirationDate": "2024-01-22"
    }
  ],
  "taxRate": 18,
  "discount": 0,
  "shipping": 0,
  "otherCharges": 0,
  "status": "received",
  "paymentStatus": "paid",
  "paymentMethod": "transferencia",
  "paidAmount": 295.00
}
```

### 4. Movements API (`/api/inventory-v2/movements`)

#### GET - Listar movimientos
```
GET /api/inventory-v2/movements
GET /api/inventory-v2/movements?type=waste
GET /api/inventory-v2/movements?itemId=456
GET /api/inventory-v2/movements?from=2024-01-01&to=2024-01-31
GET /api/inventory-v2/movements?limit=50
```

#### POST - Crear movimiento manual
```json
{
  "inventoryItemId": "456",
  "itemName": "Pechuga de Pollo",
  "type": "adjustment",
  "quantity": 2,
  "unit": "kg",
  "isEntry": false,
  "reason": "Merma por vencimiento",
  "performedBy": "Admin"
}
```

### 5. Analytics API (`/api/inventory-v2/analytics`)

#### Dashboard Stats
```
GET /api/inventory-v2/analytics?type=dashboard
```

#### Full Analytics
```
GET /api/inventory-v2/analytics?type=full&from=2024-01-01&to=2024-01-31
```

#### Reorder Suggestions
```
GET /api/inventory-v2/analytics?type=reorder
```

#### Stock Valuation
```
GET /api/inventory-v2/analytics?type=valuation
```

#### Inventory Turnover
```
GET /api/inventory-v2/analytics?type=turnover&from=2024-01-01&to=2024-01-31
```

---

## 🚀 Uso del Sistema

### 1. Configuración Inicial

#### Crear Proveedores
1. Ir a la sección "Proveedores"
2. Click en "+ Nuevo Proveedor"
3. Completar datos de contacto y categorías
4. Guardar

#### Crear Artículos de Inventario
1. Ir a la sección "Artículos"
2. Click en "+ Nuevo Artículo"
3. Completar:
   - Nombre y categoría
   - Unidad de medida
   - Stock mínimo, máximo y punto de reorden
   - Proveedor preferido
   - Si es perecedero y vida útil
4. Guardar

### 2. Registro de Compras

#### Crear Orden de Compra
1. Ir a "Compras" → "+ Nueva Compra"
2. Seleccionar proveedor
3. Seleccionar fecha de compra
4. Agregar ítems:
   - Click "+ Agregar Item"
   - Seleccionar artículo del inventario
   - Ingresar cantidad y costo unitario
   - Si tiene lote/vencimiento, registrarlo
5. El sistema calcula automáticamente:
   - Subtotal por ítem
   - Subtotal general
   - IGV (18%)
   - Total
6. Agregar envío u otros cargos si aplica
7. Seleccionar estado: "Borrador" o "Pedido"
8. Si ya se recibió: cambiar a "Recibido"
9. Registrar pago:
   - Método de pago
   - Monto pagado
10. Guardar

**Nota:** Al marcar como "Recibido", el sistema:
- ✅ Actualiza automáticamente el stock de cada artículo
- ✅ Crea movimientos de inventario
- ✅ Actualiza el costo promedio de los artículos

### 3. Movimientos Manuales

#### Registrar Ajuste de Inventario
1. Ir a "Movimientos" → "+ Nuevo Movimiento"
2. Seleccionar tipo: "Ajuste"
3. Seleccionar artículo
4. Ingresar cantidad
5. Seleccionar si es entrada o salida
6. Agregar razón del ajuste
7. Guardar

#### Registrar Merma
1. Ir a "Movimientos" → "+ Nuevo Movimiento"
2. Seleccionar tipo: "Merma"
3. Seleccionar artículo
4. Ingresar cantidad desperdiciada
5. Agregar razón (vencimiento, daño, etc.)
6. Guardar

### 4. Monitoring y Analytics

#### Ver Dashboard
- Dashboard muestra en tiempo real:
  - Valor total del inventario
  - Items con stock crítico
  - Compras y mermas del mes
  - Alertas de items sin stock

#### Reorden de Stock
1. Ir a "Reorden"
2. Ver lista de sugerencias con nivel de urgencia
3. Items críticos (sin stock) aparecen primero
4. Para cada item ver:
   - Stock actual
   - Cantidad sugerida a ordenar
   - Costo estimado
   - Proveedor recomendado
5. Click en "Crear OC" para generar orden de compra automática

#### Analytics Avanzado
1. Ir a "Analytics"
2. Seleccionar rango de fechas
3. Ver:
   - Rotación de inventario
   - Análisis ABC
   - Top artículos más/menos vendidos
   - Desempeño de proveedores
   - Tendencias de costos

---

## 🔄 Flujos de Trabajo

### Flujo de Compra Completa

```
1. Crear OC en estado "Borrador"
   ↓
2. Revisar y cambiar a "Pedido"
   ↓
3. Enviar OC al proveedor
   ↓
4. Recibir mercancía
   ↓
5. Actualizar OC a "Recibido"
   → Sistema actualiza stock automáticamente
   → Crea movimientos de inventario
   → Actualiza costos promedio
   ↓
6. Registrar pago
   ↓
7. Subir factura y comprobante
```

### Flujo de Control de Stock

```
1. Sistema monitorea stock en tiempo real
   ↓
2. Cuando stock ≤ punto de reorden
   → Genera sugerencia automática
   → Alerta en dashboard
   ↓
3. Admin revisa sugerencias
   ↓
4. Crea OC basada en sugerencia
   ↓
5. Ciclo de compra se reinicia
```

### Flujo de Mermas

```
1. Detectar merma (vencimiento, daño, etc.)
   ↓
2. Crear movimiento tipo "Merma"
   ↓
3. Especificar razón
   ↓
4. Sistema reduce stock automáticamente
   ↓
5. Registra costo de la merma
   ↓
6. Incluye en reportes mensuales
```

---

## 🎨 Características de UI/UX

- **🌈 Color Coding**: Cada categoría tiene su color distintivo
- **⚡ Actualizaciones en Tiempo Real**: Auto-refresh cada 30 segundos
- **🔔 Alertas Visuales**: Animaciones para items críticos
- **📱 Diseño Responsive**: Funciona en mobile, tablet y desktop
- **🎯 Navegación Intuitiva**: Tabs organizados por sección
- **💾 Auto-save**: Formularios guardan progreso
- **🔍 Búsqueda Rápida**: Filtros en todas las secciones
- **📊 Visualizaciones**: Gráficos y stats cards claros
- **✅ Validaciones**: Campos validados antes de guardar
- **🚨 Confirmaciones**: Diálogos de confirmación para acciones críticas

---

## 📈 Próximas Funcionalidades (Futuras)

1. **Sistema de Recetas (BOM)**
   - Vincular productos terminados con ingredientes
   - Cálculo automático de costos de producción
   - Deducción automática de ingredientes al producir

2. **Múltiples Ubicaciones**
   - Gestión de inventario por sucursal
   - Transferencias entre ubicaciones
   - Consolidación de reportes

3. **Códigos de Barras**
   - Generación de códigos de barras
   - Scanner para entrada/salida rápida
   - Impresión de etiquetas

4. **Lotes y Trazabilidad**
   - Seguimiento completo por lote
   - Trazabilidad de origen a consumo
   - Recalls automáticos

5. **Integración con Ventas**
   - Deducción automática de stock al vender
   - Sincronización con sistema de pedidos
   - Alertas de productos agotados al tomar pedidos

6. **Reportes Avanzados**
   - Exportación a Excel/PDF
   - Reportes personalizados
   - Gráficos interactivos
   - Dashboard ejecutivo

7. **Notificaciones**
   - Alertas por email/SMS
   - Notificaciones push
   - Recordatorios de vencimientos
   - Alertas de pagos pendientes

---

## 🔒 Seguridad y Permisos

### Niveles de Acceso (Futuro)
- **Admin Total**: Acceso completo
- **Gerente**: Ver y editar, no eliminar
- **Operador**: Solo registro de movimientos
- **Visualizador**: Solo lectura

### Auditoría
- Todos los movimientos registran usuario y timestamp
- Historial completo de cambios
- No se pueden eliminar movimientos, solo anular

---

## 💡 Mejores Prácticas

1. **Registrar Compras Inmediatamente**: Al recibir mercancía
2. **Revisar Sugerencias Semanalmente**: Evitar quiebres de stock
3. **Registrar Mermas Diariamente**: Para costos precisos
4. **Actualizar Costos**: Al recibir nuevas cotizaciones
5. **Revisar Analytics Mensualmente**: Para decisiones estratégicas
6. **Mantener Proveedores Actualizados**: Datos de contacto y términos
7. **Configurar Puntos de Reorden**: Basados en consumo real
8. **Registrar Lotes y Vencimientos**: Para productos perecederos

---

## 📞 Soporte

Para dudas o problemas:
1. Consultar esta guía
2. Revisar mensajes de error en consola
3. Verificar que todos los archivos de datos existen
4. Revisar que los APIs respondan correctamente

---

**Versión**: 1.0.0
**Última actualización**: Febrero 2024
**Desarrollado para**: Santo Dilema Dark Kitchen

---

🎉 **¡Sistema de Inventario Profesional Listo para Usar!** 🎉
