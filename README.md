# Santo Dilema - Dark Kitchen

Una plataforma web moderna y disruptiva para Santo Dilema, dark kitchen especializada en alitas y ensaladas.

## Concepto

Santo Dilema plantea un dilema al cliente: **¿Comer fit o fat?**

- **FIT**: Ensaladas saludables y nutritivas
- **FAT**: Alitas irresistibles y deliciosas

## Características

- Diseño premium y moderno
- Experiencia de usuario fluida
- Separación clara entre conceptos (fit/fat)
- Sistema de pedidos integrado
- Panel de administración para gestión de órdenes
- Responsive design

## Tecnologías

- **Frontend**: Next.js 15 + React 19
- **Styling**: Tailwind CSS
- **TypeScript**: Para type safety
- **API**: Next.js API Routes
- **Almacenamiento**: JSON file-based (evolución a DB posteriormente)

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Ejecutar en modo desarrollo:
```bash
npm run dev
```

3. Abrir en el navegador:
```
http://localhost:3000
```

## Estructura del Proyecto

```
santo-dilema/
├── app/
│   ├── page.tsx              # Landing page (elección fit/fat)
│   ├── fit/                  # Sección de ensaladas
│   │   └── page.tsx
│   ├── fat/                  # Sección de alitas
│   │   └── page.tsx
│   ├── checkout/             # Página de checkout
│   │   └── page.tsx
│   ├── admin/                # Panel de administración
│   │   └── page.tsx
│   ├── api/
│   │   └── orders/           # API para gestión de pedidos
│   │       └── route.ts
│   ├── layout.tsx            # Layout principal
│   └── globals.css           # Estilos globales
├── data/                     # Almacenamiento de pedidos (generado automáticamente)
│   └── orders.json
├── components/               # Componentes reutilizables (futuro)
└── lib/                      # Utilidades (futuro)
```

## Rutas

- `/` - Landing page con elección fit/fat
- `/fit` - Menú de ensaladas
- `/fat` - Menú de alitas
- `/checkout` - Finalizar pedido
- `/admin` - Panel de administración de pedidos

## Panel de Administración

Acceder a `/admin` para:
- Ver todos los pedidos en tiempo real
- Filtrar por estado (pendiente, confirmado, entregado, cancelado)
- Actualizar estado de pedidos
- Ver estadísticas generales

## Próximos Pasos

1. Integrar logotipo oficial
2. Definir paleta de colores basada en el logo
3. Agregar más productos y categorías
4. Implementar carrito con localStorage
5. Agregar sistema de promociones
6. Integrar pasarela de pagos
7. Migrar a base de datos
8. Implementar autenticación para admin

## Desarrollo

Este es un proyecto en fase inicial. El código está estructurado para ser escalable y fácil de mantener.

### Scripts disponibles:

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Compilar para producción
- `npm start` - Ejecutar versión de producción
- `npm run lint` - Verificar código

## Contacto

Para feedback y ajustes, revisar cada implementación por etapas.
