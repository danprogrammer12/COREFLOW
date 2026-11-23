# Landing CoreFlow v2 — dirección creativa y brief de diseño

Rama `feature/landing`. Sustituye el diseño de `src/views/LandingView.jsx`. Sin dependencias nuevas. Props intactas: `isDemoData`, `onStartDemo`, `pendingDemoId`, `demoError`, `onLogin`. Anclas intactas: `#funciones`, `#como-funciona`, `#planes`.

## 1. Concepto: "Un flujo, tres estaciones"

La landing no describe el producto: lo hace funcionar. Un mismo hilo diagonal (la geometría del isotipo) cruza la página y pasa por tres estaciones que son el lema:

- **Organiza (cian):** el dato desordenado cae en su sitio (cliente, tarjeta, documento).
- **Conecta (violeta):** el hilo lo lleva al responsable y a la aprobación correcta.
- **Evoluciona (lima):** una regla automática lo cierra y el indicador sube.

Por qué encaja: el visitante ve y toca el ciclo completo en 10 segundos, y esa es la promesa de marca. Reemplaza "tres tarjetas con un número" por una demo que demuestra. Las ilustraciones son escenas de producto hechas en código, con datos de ejemplo rotulados como tal. Cada sección repite el mismo gesto (algo suelto se ordena, se conecta, mejora), así hay una sola idea y no cinco efectos.

Sustento (taste-skill, dirigido a esta marca): una idea sacada del sujeto, una "cosa viva" que se pueda tocar, sin ornamentos. Se descartan sus reglas "sin violeta" y "sin gradientes en logo" porque la marca fija el violeta; el resto aplica (sección 5).

## 2. Estructura y comportamiento

Ritmo de fondo (original; ver sección 8 para lo implementado): claro, oscuro, claro, claro, oscuro. Cortes entre secciones en diagonal (`clip-path: polygon`, inclinación ~4 grados, alude al isotipo) solo en las transiciones claro/oscuro. Ancho útil `max-w-6xl`, margen lateral 24 px móvil, 32 px desde 768.

### S0. Cabecera
Logo, 3 enlaces (Funciones, Cómo funciona, Planes), "Iniciar sesión". Barra plana blanca, borde inferior `core-border`. Al hacer scroll aparece, a la derecha, el botón primario "Explorar la demo" (solo si `canDemo`). Sin blur ni píldora flotante.

### S1. Hero: "Flujo vivo" (interacción 1)
- Fondo `core-cloud` plano. Sin blob ni gradiente.
- H1: **"Todo tu equipo en un solo flujo."** (31 caracteres, 2 líneas máx. en todos los anchos). Debajo, 1 frase: "CoreFlow reúne clientes, solicitudes, tareas y documentos, con aprobaciones y automatizaciones, para pymes." CTA primario violeta "Explorar la demo" (misma lógica actual: demo si `canDemo`, si no "Iniciar sesión"). Secundario texto "Ver cómo funciona". Mantener `demoError` con `role="alert"` y nota "Sin registro y con datos de ejemplo."
- Sin eyebrow/píldora sobre el titular.
- Derecha, **escena `FlowScene`** (50-55 % del ancho, ≥ 480 px alto en desktop): ventana de app sin falsos semáforos de macOS. Tres estaciones en columna con su color (Organiza, Conecta, Evoluciona) y un hilo SVG (`stroke-dashoffset`) que las une.
- Selector arriba de la escena (`role="tablist"`, 3 opciones): "Cliente nuevo", "Solicitud de compra", "Documento por firmar". Cada una reproduce una historia de 3 pasos (~6 s):
  1. **Organiza:** aparece la tarjeta (ej. "Distribuidora Andina · Cotización $4.200.000") en la columna "Nuevo" de un mini pipeline.
  2. **Conecta:** el hilo viaja a un chip de rol ("Gerencia") que se marca aprobado con un check.
  3. **Evoluciona:** un nodo "Si aprobado → crear tarea" se enciende y el KPI "Aprobadas este mes" cuenta de 18 a 19 (tabular-nums).
- Autoreproduce en bucle cuando está en viewport; se pausa al pasar el cursor, al enfocar, al elegir una opción o al salir de pantalla. Botón Pausa/Reproducir visible (44 px). Rotular la escena "Ejemplo ilustrativo" como `figcaption` (13 px).
- Cursor: solo en `pointer: fine`, el hilo se desplaza hasta 6 px hacia el cursor (parallax mínimo). Sin cursor personalizado.
- Móvil (360 px): escena bajo el texto, estaciones apiladas en 3 filas compactas, mismo guion; CTA antes de la escena.
- `prefers-reduced-motion`: sin bucle; se muestra el paso 3 estático y el selector cambia de historia mostrando los 3 pasos como lista numerada.

### S2. "Del caos al orden" (interacción 2, scrollytelling)
Fondo navy. Sustituye PAINS y PILLARS. Desktop: contenedor de 240 vh con escena `sticky` (top 80 px). A la izquierda 3 beats de texto (los 3 dolores, mismas frases actuales) que se resaltan según el progreso. A la derecha, 12 fragmentos dispersos con rotación (burbuja de chat "¿ya lo aprobaron?", fila de hoja de cálculo, adjunto "contrato_v3_FINAL.pdf", nota adhesiva) que con el progreso 0→1 se mueven (transform) hasta encajar en un tablero de 3 columnas y se convierten en tarjetas limpias (crossfade de contenido a 50 %). Al 100 %: el titular cambia a "Organiza. Conecta. Evoluciona." con "Evoluciona." en lima.
- Progreso por `requestAnimationFrame` leyendo `getBoundingClientRect` (listener pasivo), solo transform/opacity.
- Alternativa accesible y móvil (< 768): sin pin; interruptor "Sin CoreFlow / Con CoreFlow" (`role="switch"`, 44 px) que anima la misma transición en 600 ms. También visible en desktop.
- Reduced motion: solo el interruptor, cambio instantáneo.

### S3. Explorador de módulos (interacción 3) — id `funciones`
Fondo `core-cloud`. Titular: "Un solo lugar para lo que hoy está en cinco." (2 líneas). Layout 2 columnas: izquierda, lista vertical `role="tablist"` con los 8 módulos agrupados bajo Organiza / Conecta / Evoluciona (`TriangleMark` del color de cada grupo, sin cajas con icono en cuadro tintado); derecha, un "escenario" 3:2 sticky que cambia de escena (crossfade 220 ms + traslación 12 px). Flechas arriba/abajo cambian de pestaña. Móvil: la lista pasa a chips horizontales con scroll, escenario debajo.
Escenas (ver sección 3). Interacciones reales solo en 3: **Pipeline** (arrastrar tarjeta entre columnas con pointer events, con botones "Mover a…" como alternativa de teclado; los totales por columna se recalculan), **Roles** (selector Admin / Asesor / Solo lectura que oculta o atenúa módulos y acciones en una mini barra lateral) y **Reportes** (conmutador Mes / Trimestre que re-cuenta los KPI y redibuja las barras). El resto anima una vez al entrar en el escenario.

### S4. Calculadora "¿Cuánto tiempo recuperas?" + Planes (interacción 4) — id `planes`
Fondo blanco. Izquierda, 3 controles (slider nativo `input[type=range]` estilizado, valor visible): colaboradores, horas por semana en seguimiento manual (hojas, chats), % que automatizarías (por defecto 30 %). Derecha, resultado grande con conteo: **horas al mes recuperadas** = horas × 4,3 × % ; fórmula visible debajo ("estimación con tus propios datos, no es una promesa"). Sin cifras inventadas de mercado. Según colaboradores recomienda plan (leer `limits` y `collaboratorsRangeLabel` de `PLANS_CATALOG`; no codificar umbrales a mano) y resalta su `PlanCard` con anillo violeta 2 px y etiqueta "Recomendado para tu equipo". Debajo, los dos `PlanCard` actuales (Starter claro, Business navy) sin cambios de lógica.

### S5. Cierre
Navy, diagonal superior. Lema grande a ancho completo (display) con "Evoluciona." en lima. Botones: "Explorar la demo" lima/navy y "Iniciar sesión" contorno blanco. Tras el cierre, footer actual (`LegalFooter` intacto).

## 3. Ilustraciones de producto (SVG/CSS/React, sin fotos de stock)

Ubicación sugerida: `src/components/landing/scenes/`. Un componente por escena, todas con `aria-hidden="true"` y `figcaption` o texto alterno corto en el contenedor. Lenguaje gráfico único: ventana blanca, radio 14 px, borde `core-border`, tarjetas internas radio 8-12, datos reales de ejemplo en español, números con `tabular-nums`. Sombra solo en la ventana del hero (`shadow-float`); el resto, salto de tono. Color: cian = en proceso/entrada, violeta = acción/vínculo, lima = resultado/cierre, azul real solo en datos. Sin texto blanco sobre cian o lima.

| Escena | Composición |
|---|---|
| FlowScene (hero) | 3 estaciones + hilo diagonal; ver S1. |
| Pipeline | 4 columnas (Nuevo, Contacto, Propuesta, Cierre), 6 tarjetas con empresa y monto COP, suma por columna; tarjeta arrastrada se eleva 4 px y gira 1.5 grados. |
| Ficha de cliente | Encabezado con iniciales, 3 datos, línea de tiempo vertical de 4 eventos (llamada, propuesta, documento, tarea) que entran en cascada de 70 ms. |
| Solicitudes | Tarjeta de solicitud con stepper de aprobación (Jefe, Gerencia, Compras); al entrar, los pasos se marcan uno a uno. |
| Tareas | Lista de 5 tareas, una se completa (check dibujado con `stroke-dashoffset`) y el contador "3 pendientes" baja. |
| Automatizaciones | 3 nodos (Disparador, Condición, Acción) unidos por trazos; el pulso viaja por el trazo; el usuario puede apagar la regla y el pulso se detiene. |
| Control documental | Pila de 3 hojas con "v1 / v2 / v3", la última con un tramo resaltado en lima; botón "Descargar" y fila de historial. |
| Reportes | 3 KPI que cuentan + 7 barras (la última violeta, resto violeta al 25 %), eje con 3 etiquetas. |
| Roles y auditoría | Barra lateral navy mini + registro de 4 eventos "Ana editó cliente · hace 2 min". |

Rótulo común: "Datos de ejemplo". No usar el logo dentro de las escenas salvo `CoreFlowIsotipo` en la barra lateral. Formas de apoyo: solo `TriangleMark`/`TriangleCluster` de `BrandShapes.jsx`, y el teselado de `.cf-auth-pattern` sobre navy (baja opacidad, nunca sobre texto ni logo).

Raster: **no se necesita ninguno.** Opcional: 1 imagen Open Graph 1200x630 (navy, escena Pipeline recortada, lema); se arma con captura de la propia escena, no con IA.

## 4. Tipografía, espacio, color y motion

- **Fuente:** Inter ya cargada. No sumar fuente display: el titular fuerte se logra con tamaño y peso, y evita ~30-60 KB extra y un cambio de marca (BRAND.md ya señala duda sobre el wordmark). Si se aprueba, usar `@fontsource-variable/inter` en lugar de pesos sueltos.
- **Escala (5 tamaños):** Display `clamp(2.5rem, 6.4vw, 4.75rem)` / 800 / tracking -0.035em / leading 1.02 (hero y cierre). H2 `clamp(1.875rem, 3.6vw, 2.75rem)` / 700 / -0.025em / 1.1. H3 20 px / 600. Cuerpo 17-18 px / 400 / 1.6 (máx. 62ch). Auxiliar 13-14 px. Cifras de KPI 40-56 px / 800 / tabular-nums.
- **Espaciado:** múltiplos de 4. Entre secciones 96 px móvil, 160 px desktop (el actual `py-20` es el doble de apretado que lo que pide una página con escenas). Dentro de una sección, 24-48 px.
- **Contraste (verificar con herramienta antes de cerrar):** violeta `#6545E8` sobre navy da ~2.9:1, no sirve como texto en oscuro; sobre navy usar violeta solo como relleno/trazo y texto en blanco, cian o lima. Lima sobre blanco no cumple: usar `#5A8700` (~4.3:1, apenas bajo AA en texto normal) solo en texto >= 19 px bold, o como relleno. Texto de cuerpo gris `#64748B` sobre `#F4F5FA` queda justo (~4.4:1): oscurecer a `#566275` en cuerpo.
- **Motion:** entrada de bloques 480 ms `cubic-bezier(0.16,1,0.3,1)`, translateY 20 px + opacidad, escalonado 70 ms, una vez (`IntersectionObserver`, umbral 0.2, el contenido es visible sin JS). Conteos 900 ms ease-out. Hilo/pulso 700 ms lineal. Hover/foco 150 ms (`--cf-duration-fast`). Cambio de escena 220 ms. Solo `transform` y `opacity`. Pausar todo bucle fuera de viewport y con pestaña oculta. `@media (prefers-reduced-motion: reduce)`: sin bucles, sin parallax, sin pin; estados finales visibles, transiciones <= 1 ms.
- **Hover/foco:** tarjetas y pestañas suben 2 px y pasan a `shadow-card-hover`; foco `outline 2px core-violet, offset 2px` (constante `FOCUS` actual; sobre navy usar outline blanco). Objetivos táctiles >= 44 px (hoy los botones del header de 40 px se suben a 44).
- **Hooks a crear:** `useInView`, `useReducedMotion`, `useScrollProgress` (rAF), `useCountUp`. Sin librerías.

## 5. Reglas anti-genérico (qué NO hacer)

1. Nada de eyebrow ni píldora sobre el titular ("Gestión organizacional para pymes", "Cómo funciona", "Planes"): se pone la información en el H2.
2. Nada de blobs, halos o gradientes de fondo (el `blur-2xl` actual del hero se elimina), ni sombras de color.
3. Nada de cuadrícula de 8 tarjetas idénticas con icono en cuadro tintado ni fila de 3 pilares numerados: el módulo se explica con su escena.
4. Nada de mockup de dashboard con barras grises y "lorem": cada escena usa datos coherentes (los totales suman).
5. Nada de logos de clientes, testimonios, métricas ni "+500 empresas" inventados. Prueba social solo si existe y es verificable.
6. Nada de scroll-hijack: el scroll nunca se bloquea ni se secuestra; el pin solo en S2 y siempre con alternativa.
7. Nada de animar por animar: cada movimiento muestra un cambio de estado del producto (aprobar, contar, mover).
8. Nada de fotos de stock ni de personas sonriendo con portátil; nada de emoji; nada de logo alternativo ni versión con IA.
9. Nada de copy genérico ("potencia tu negocio", "solución todo en uno"): usar el vocabulario del cliente (solicitud, aprobación, pipeline, historial).
10. Nada de CTA repetidos con distinto nombre: una acción primaria por pantalla, "Explorar la demo".

## 6. Orden de implementación para frontend-webcore

1. Hooks + utilidades CSS de reveal en `src/styles` (reduced-motion primero).
2. `FlowScene` + hero (valor más alto; si solo se hace una cosa, esta).
3. Explorador S3 con las 9 escenas estáticas; luego Pipeline, Roles y Reportes interactivos.
4. S2 caos a orden (interruptor primero, scroll después).
5. Calculadora + recomendación de plan sobre `PLANS_CATALOG`.
6. Cierre, cortes diagonales y limpieza de lo viejo (`ProductPreview`, PAINS/PILLARS).
7. Verificar: 360/768/1440 px, teclado completo, reduced-motion, contraste, rendimiento (CLS 0, sin long tasks en scroll), `npm run build`.

## 7. Aprobación pendiente del usuario

- Fuente display adicional: se recomienda NO.
- Titular nuevo del hero ("Todo tu equipo en un solo flujo.") frente al actual.
- Calculadora: aceptar que el resultado es una estimación del propio visitante y que recomienda plan por número de colaboradores.
- Pin de scroll en S2 en desktop (con alternativa por interruptor).
- Hacer el hero con datos de ejemplo en COP; confirmar que se rotulan "Datos de ejemplo".


## 8. Estado implementado (actualiza las secciones anteriores donde se contradigan)

La landing quedó **oscura de punta a punta** con color de marca; ya no hay ritmo claro/oscuro ni fondos `core-cloud`/blanco lisos.

- **Cabecera (S0):** barra a todo el ancho (padding 16/24/32 px) con cuadrícula de 3 zonas: logo en el extremo izquierdo, enlaces (Cómo funciona, Funciones, Planes) centrados de verdad, y a la derecha "Iniciar sesión" (contorno) + "Explorar la demo" (lima, **siempre visible**, con estado de carga y error). En móvil: logo, demo y botón de menú; los enlaces e "Iniciar sesión" pasan al menú desplegable (Escape lo cierra).
- **Fondos:** navy con mallas de gradiente de la paleta (`Atmos`), grano y retícula. Marquee inclinado de módulos en degradado azul-violeta con facetas navy. Banda de métricas en degradado azul-violeta con tarjetas navy translúcidas. Planes: panel `lf-panel-brand` (degradado cian/violeta/azul con toque lima) con borde luminoso; calculadora en vidrio oscuro; Starter con acento cian y Business con acento lima.
- **Triángulos:** `Tri` y `TriEdge` (`atmos.jsx`) con clases `lf-tri-*` (`landing.css`): tonos cian, violeta, lima, azul, blanco, navy y mezcla; tamaños base/lg/xl; máscaras que desvanecen hacia el texto (`lf-tri-m-*`). Presentes en hero, marquee, cómo funciona, explorador, día a día, métricas, planes y cierre; separadores de serrucho en explorador, día a día y planes. Nunca sobre el logo.
- **Día a día:** tarjetas con tinte de marca (cian, violeta, lima, azul), banda de degradado y facetas en la esquina. Las ventanas de escena (`SceneWindow`) usan tinte y cabecera de degradado en lugar de blanco.
- **Pestañas activas** (explorador y hero): lima con texto navy.
- **Contraste verificado** (render sin texto, percentil del fondo): todo el texto real >= 4,5:1; el más bajo ~4,5:1 (texto gris pequeño de tarjetas tintadas).

## 9. Pantalla de demo (`/demo`)

`src/views/DemoView.jsx`, ruta propia con History API (el botón atrás del navegador vuelve a la landing). Solo existe con datos de ejemplo (`isDemoData`) y sin sesión.

- **Qué muestra:** cabecera mínima con logo y "Volver al inicio", fondo navy con `Atmos` y `Tri`, y dos tarjetas (Starter y Business) con borde luminoso. Cada una: límites reales leídos de `PLANS_CATALOG` (colaboradores, sedes, automatizaciones, administradores, permisos), 4 cosas que se pueden probar según el plan, rótulo "Datos de ejemplo" y botón "Entrar a la demo de X".
- **Quién abre la pantalla:** "Explorar la demo" (barra, hero y cierre) navega a `/demo` (prop nueva opcional `onOpenDemo` de `LandingView`; sin ella se mantiene el comportamiento anterior). Los botones "Ver demo de Starter/Business" de los planes abren la pantalla y **arrancan ese plan directo** (el clic ya expresa la elección).
- **Carga:** "Preparando tu espacio de demostración…" con el isotipo que se arma pieza a pieza y un anillo giratorio (sin animación con `prefers-reduced-motion`), región `aria-live="polite"` y foco en el encabezado. La autenticación demo es síncrona, así que `startDemoWithTransition` (`App.jsx`) mantiene la carga 900 ms antes de llamar a `handleStartDemo`; si la persona vuelve atrás durante ese tiempo, se cancela.
- **Error:** aviso `role="alert"` con foco y botón "Reintentar con X"; las dos opciones siguen disponibles sin salir de la pantalla.
- **Navegación:** Escape y "Volver al inicio" usan `goToHome` (apaga `showAuthScreen`); al entrar, `handleStartDemo` vuelve a `/` (replace) y abre el dashboard.
