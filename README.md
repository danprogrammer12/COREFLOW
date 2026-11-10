# CoreFlow

Plataforma modular de gestión organizacional por Webcore Solutions.

**Estado:** prototipo de interfaz (v0.1.0). Todavía no tiene backend ni variables de entorno.

## Stack

- React 18 + Vite 6
- Tailwind CSS 3
- lucide-react (iconos)

## Desarrollo

Requiere Node.js y npm.

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # compilación de producción en dist/
npm run preview  # sirve la compilación localmente
```

El proyecto aún no tiene pruebas automatizadas.

## Estructura

```text
public/brand/      Logos e isotipo en SVG
src/components/    Marca, gráficas, layout, modales y primitivas de UI
src/styles/        Tokens de diseño
src/views/         Autenticación, dashboard, design system y módulos
```
