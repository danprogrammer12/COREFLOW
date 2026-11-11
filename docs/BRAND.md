# CoreFlow — Identidad visual

Referencia obligatoria para Claude, Codex, Antigravity y cualquier persona que diseñe o desarrolle CoreFlow. Los valores viven en `src/styles/tokens.css`; este documento los explica y no los redefine.

## A. Identidad de marca

**Nombre:** CoreFlow. Una sola palabra, con C y F en mayúscula.

**Descripción:** plataforma SaaS modular de gestión organizacional para pequeñas y medianas empresas, desarrollada por Webcore.

**Propuesta de valor:**
- **Organiza** la información y las operaciones.
- **Conecta** equipos, áreas y procesos.
- **Evoluciona** mediante automatizaciones e indicadores.

**Eslogan:** Organiza. Conecta. Evoluciona.

**Personalidad:** confiable, clara, organizada, segura y tecnológicamente madura.

**Posicionamiento visual:** minimalismo tecnológico con identidad corporativa. Se reconoce por su símbolo, su paleta y su orden, no por efectos.

## B. Logotipo

El logo está compuesto por un símbolo geométrico de tres piezas diagonales, en cian, violeta y verde lima, y el wordmark CoreFlow. Es un **activo bloqueado**.

**Recursos oficiales:**

| Recurso | Ubicación |
|---|---|
| Componente React | `src/components/brand/CoreFlowLogo.jsx` (`CoreFlowLogo`, `CoreFlowIsotipo`) |
| Símbolo | `public/brand/coreflow-isotipo.svg` |
| Horizontal sobre fondo oscuro | `public/brand/coreflow-logo-horizontal-dark.svg` |
| Horizontal sobre fondo claro | `public/brand/coreflow-logo-horizontal-light.svg` |
| Vertical sobre fondo oscuro | `public/brand/coreflow-logo-vertical-dark.svg` |
| Monocromo blanco | `public/brand/coreflow-logo-mono-white.svg` |
| Monocromo navy | `public/brand/coreflow-logo-mono-navy.svg` |
| Favicon | `public/favicon.svg` |

En React se usa siempre `CoreFlowLogo` o `CoreFlowIsotipo`. Nunca se copian sus trazados a otro archivo.

**Usos correctos:**
- `theme="dark"` sobre Midnight Navy, `theme="light"` sobre blanco o Cloud Gray.
- Versiones monocromas solo cuando el color no sea posible.
- En el eslogan, "Evoluciona." se destaca en verde lima sobre fondo oscuro y en violeta sobre fondo claro.

**Usos incorrectos:**
- Redibujar el símbolo o crear variantes.
- Cambiar proporciones, composición o colores.
- Sustituirlo por iconos genéricos o por las letras "CF".
- Aplicarle sombras, brillos, contornos o cualquier efecto.
- Generar una versión con IA.

**Proporciones:** el símbolo se dibuja en una retícula cuadrada de 120 × 120 y siempre se muestra en un contenedor cuadrado.

**Espacio de seguridad y tamaño mínimo:** no están definidos oficialmente. Deben fijarse con el responsable de marca.

**Pendiente:** el arte original en imagen parece usar para el wordmark una letra más redondeada que Inter, mientras que los SVG y el componente usan Inter 800. Hace falta confirmar cuál es la versión aprobada y añadir el arte original al repositorio, que hoy no lo contiene.

## C. Colores

| Color | HEX | Token | Función |
|---|---|---|---|
| Midnight Navy | `#171936` | `--cf-midnight-navy` | Principal. Fondos de marca, navegación, texto principal |
| Electric Violet | `#6545E8` | `--cf-electric-violet` | Principal. Acción primaria, foco, enlaces |
| Royal Blue | `#3568E8` | `--cf-royal-blue` | Secundario. Apoyo en datos y acciones alternativas |
| Cyan | `#08C9E8` | `--cf-cyan` | Secundario. Acento, estados en proceso |
| Lime Green | `#A6E91C` | `--cf-lime-green` | Secundario. Acento sobre fondos oscuros |
| Cloud Gray | `#F4F5FA` | `--cf-cloud-gray` | Fondo de aplicación |
| White | `#FFFFFF` | `--cf-white` | Superficies y formularios |

**Reglas de combinación:**
- Fondos claros para trabajar; Midnight Navy para marca y navegación.
- Una sola acción primaria en violeta por vista.
- Texto blanco sobre violeta. Cian y verde lima no llevan texto blanco ni se usan como texto sobre blanco: no alcanzan el contraste.
- El color comunica una función; no se reparte para decorar.

Los neutros y colores de estado de `tokens.css` son funcionales, no colores de marca. No se añaden colores de marca sin aprobación.

## D. Tipografía

**Familia:** Inter (`--cf-font-sans`). **Pesos:** 400, 500, 600, 700 y 800.

| Nivel | Tamaño | Peso | Uso |
|---|---|---|---|
| Display | 44–68 px | 800, tracking -0.03em | Solo eslogan y momentos de marca |
| Título de pantalla | 28 px | 700 | Encabezado principal |
| Subtítulo | 18–20 px | 600 | Secciones |
| Texto general | 15–16 px | 400 | Lectura y formularios |
| Etiquetas | 14 px | 500 | Campos y acciones |
| Auxiliar | 13 px | 400 | Ayudas y notas |

## E. Sistema visual

**Espaciado:** múltiplos de 4 px, `--cf-space-*`. Más espacio encima de un título que debajo.

**Radios:** `--cf-radius-sm` 8 px en controles, `--cf-radius-md` 12 px, `--cf-radius-card` 14 px en tarjetas y `--cf-radius-lg` 16 px.

**Bordes:** `--cf-border` en superficies, `--cf-border-control` en campos de formulario.

**Sombras:** `--cf-shadow-card` y `--cf-shadow-elevated`. Siempre con desplazamiento y difuminado; nunca halos de color.

**Botones:** alturas de 32, 40 y 44 px, componente `Button` en `Primitives.jsx`. El principal va en violeta, y el deshabilitado baja la opacidad.

**Inputs:** etiqueta visible encima del campo, 44 px de alto en formularios principales. Los errores se muestran bajo el campo y dicen cómo corregirse.

**Tarjetas:** solo cuando agrupan contenido relacionado. Nunca anidadas ni usadas como relleno.

**Navegación:** barra lateral Midnight Navy con el logo arriba y el perfil anclado abajo.

**Iconografía:** `lucide-react`, trazo uniforme. Un icono acompaña a un significado; no decora.

**Teselado de triángulos:** facetas tonales blancas de muy baja opacidad, sin trazo, solo sobre Midnight Navy (`.cf-auth-pattern` en `src/index.css`). Se desvanece hacia el texto y nunca pasa por encima del logo.

**Estados de interacción:** todo control tiene reposo, hover, foco visible, deshabilitado y, si aplica, carga y error. Transiciones con `--cf-duration-fast` y `--cf-ease-out`, respetando `prefers-reduced-motion`.

**Tablas y formularios:** alineación consistente, cifras legibles, etiquetas siempre visibles y una acción principal clara.

## F. Reglas para diseñadores y agentes de IA

1. La identidad visual oficial no puede modificarse sin autorización.
2. No generar logos alternativos.
3. No reemplazar activos oficiales por imágenes generadas.
4. No introducir colores de marca nuevos sin aprobación.
5. Evitar diseños genéricos de SaaS.
6. Mantener consistencia entre todos los módulos.
7. Priorizar claridad, funcionalidad y jerarquía.
8. Toda nueva interfaz debe respetar el sistema de diseño documentado.

## Fuente de verdad

`src/styles/tokens.css` centraliza los valores. `tailwind.config.js` los replica para las clases de Tailwind, con dos diferencias pendientes de unificar: el hover de violeta (`#5334D3` y `#5435D4`) y el verde lima oscuro (`#5A8700` y `#6B9B08`).
