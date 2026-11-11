/**
 * DOCUMENTOS LEGALES DE COREFLOW — BORRADORES PARA REVISIÓN JURÍDICA
 * CoreFlow — src/legal/documents.js
 *
 * No son asesoría jurídica ni versiones definitivas. Los datos de Webcore que no
 * constan en el proyecto aparecen como [POR VALIDAR: …] y deben completarse y
 * revisarse por un abogado antes de publicarse.
 */

import { COOKIE_NOTICE_VERSION, PRIVACY_POLICY_VERSION } from '../core/privacy/consent.js'

export const PENDING = Object.freeze({
  legalName: '[POR VALIDAR: razón social de Webcore]',
  taxId: '[POR VALIDAR: NIT]',
  address: '[POR VALIDAR: domicilio y dirección física]',
  privacyEmail: '[POR VALIDAR: correo de privacidad]',
  phone: '[POR VALIDAR: teléfono de contacto]',
  representative: '[POR VALIDAR: representante legal]',
  registry: '[POR VALIDAR: matrícula mercantil y cámara de comercio]',
  privacyArea: '[POR VALIDAR: área o persona responsable de atender solicitudes]',
  effectiveDate: '[POR VALIDAR: fecha de entrada en vigencia]',
  jurisdiction: '[POR VALIDAR: ciudad y jurisdicción aplicable]',
})

const P = PENDING
const DRAFT = Object.freeze({ published: 'Pendiente de publicación (borrador)', updated: '11 de noviembre de 2026' })

export const LEGAL_DOCUMENTS = [
  {
    slug: 'privacidad',
    title: 'Política de privacidad',
    description: 'Qué información trata CoreFlow, para qué, con quién se comparte y cómo puedes ejercer tus derechos.',
    version: PRIVACY_POLICY_VERSION,
    ...DRAFT,
    sections: [
      {
        id: 'quienes',
        heading: 'Quién presta el servicio',
        body: [
          `CoreFlow es una plataforma de gestión organizacional desarrollada y operada por ${P.legalName}, identificada con NIT ${P.taxId}, con domicilio en ${P.address} (en adelante, «Webcore»).`,
          `Para cualquier asunto de privacidad puedes escribir a ${P.privacyEmail}.`,
        ],
      },
      {
        id: 'roles',
        heading: 'Dos papeles distintos: Webcore y tu organización',
        body: [
          'CoreFlow es una plataforma multiempresa: varias organizaciones la usan, cada una con su información aislada de las demás. Por eso intervienen dos papeles diferentes:',
          {
            list: [
              'Webcore actúa como responsable del tratamiento de los datos que usa para sus propios fines: crear y administrar cuentas, prestar y facturar el servicio, garantizar su seguridad y atender solicitudes.',
              'La organización cliente que contrata CoreFlow decide qué información de sus clientes, colaboradores y procesos registra en la plataforma. Frente a esos datos, la organización puede actuar como responsable del tratamiento y Webcore como encargado, porque los procesa por cuenta de ella y siguiendo sus instrucciones.',
            ],
          },
          'Cada organización define sus propias finalidades y autorizaciones. Si tus datos fueron registrados por una organización que usa CoreFlow, consulta primero su política de tratamiento; Webcore trasladará a esa organización las solicitudes que le correspondan.',
        ],
      },
      {
        id: 'datos',
        heading: 'Qué datos tratamos',
        body: [
          {
            list: [
              'Datos de cuenta: nombre, correo electrónico, cargo, rol y organización a la que perteneces.',
              'Datos operativos que cada organización registra: clientes, solicitudes, tareas, oportunidades y documentos. Su contenido depende de cada organización.',
              'Registros de seguridad y auditoría: quién hizo cada cambio y cuándo, para proteger la integridad de la información.',
              'Datos técnicos generados por la infraestructura, como la dirección IP y el navegador, en los registros de los proveedores de alojamiento.',
              'Tu decisión sobre cookies, con un identificador aleatorio que no te identifica por sí solo.',
            ],
          },
          'CoreFlow no solicita datos sensibles ni está dirigido a niños, niñas o adolescentes. Si una organización registra este tipo de datos, lo hace bajo su responsabilidad y con las autorizaciones que exige la ley.',
        ],
      },
      {
        id: 'finalidades',
        heading: 'Para qué los usamos',
        body: [
          {
            list: [
              'Permitir el inicio de sesión y controlar el acceso según la organización y el rol.',
              'Prestar las funciones contratadas y mantener separada la información de cada organización.',
              'Proteger la plataforma, prevenir usos indebidos y conservar la trazabilidad de los cambios.',
              'Atender consultas, reclamos y solicitudes de soporte.',
              'Cumplir obligaciones legales y contractuales.',
            ],
          },
          'No vendemos datos personales ni los usamos para publicidad.',
        ],
      },
      {
        id: 'proveedores',
        heading: 'Con quién compartimos información',
        body: [
          'Para operar CoreFlow usamos proveedores que tratan datos por cuenta de Webcore:',
          {
            table: {
              head: ['Proveedor', 'Para qué', 'Ubicación'],
              rows: [
                ['Supabase', 'Base de datos, autenticación y almacenamiento de archivos', 'Estados Unidos (región us-east-1), según la configuración actual'],
                ['Vercel', 'Publicación de la aplicación web', '[POR VALIDAR: regiones de Vercel aplicables]'],
                ['Google Fonts', 'Entrega de la tipografía Inter', 'Servidores de Google; recibe la dirección IP del visitante'],
              ],
            },
          },
          'Estas entregas pueden implicar transmisión internacional de datos. [POR VALIDAR: revisión jurídica de las transmisiones internacionales a la luz del Decreto 1074 de 2015 y de las circulares vigentes de la Superintendencia de Industria y Comercio, y de los contratos con cada proveedor].',
        ],
      },
      {
        id: 'seguridad',
        heading: 'Cómo protegemos la información',
        body: [
          {
            list: [
              'La información de cada organización está aislada mediante reglas de acceso en la base de datos (Row Level Security), que se aplican en el servidor y no dependen del navegador.',
              'Los accesos se conceden por rol y la información se transmite cifrada.',
              'Los registros de auditoría no se pueden modificar ni borrar desde la aplicación.',
              'Los documentos se guardan en un almacenamiento privado y solo se abren con enlaces temporales.',
            ],
          },
          'Ninguna medida elimina por completo el riesgo. Si detectamos un incidente que afecte tus datos, lo informaremos según lo exija la ley.',
        ],
      },
      {
        id: 'conservacion',
        heading: 'Cuánto tiempo conservamos los datos',
        body: [
          'Conservamos los datos mientras exista la relación con la organización y durante el tiempo necesario para cumplir obligaciones legales, contractuales o de auditoría. [POR VALIDAR: plazos concretos de conservación por tipo de dato y procedimiento de devolución o eliminación al terminar el contrato].',
          'Algunas solicitudes de supresión no proceden cuando existe un deber legal o contractual de conservar la información. En ese caso te explicaremos el motivo.',
        ],
      },
      {
        id: 'derechos',
        heading: 'Tus derechos',
        body: [
          'Puedes conocer, actualizar, rectificar y solicitar la supresión de tus datos, revocar la autorización cuando proceda y presentar consultas y reclamos. El procedimiento y los plazos están en la Política de tratamiento de datos personales.',
          { link: { label: 'Ejercer mis derechos', href: '#/legal/derechos' } },
        ],
      },
      {
        id: 'cambios',
        heading: 'Cambios en esta política',
        body: [
          'Publicaremos cualquier cambio en esta página. Los cambios sustanciales se informarán antes de aplicarse, y cuando cambie la versión volveremos a pedir tu decisión sobre cookies.',
        ],
      },
    ],
  },
  {
    slug: 'cookies',
    title: 'Política de cookies',
    description: 'Qué guarda CoreFlow en tu navegador, para qué sirve cada elemento y cómo cambiar tu decisión.',
    version: COOKIE_NOTICE_VERSION,
    ...DRAFT,
    sections: [
      {
        id: 'que-son',
        heading: 'Qué son las cookies y el almacenamiento local',
        body: [
          'Las cookies y el almacenamiento local son pequeños datos que un sitio guarda en tu navegador. CoreFlow usa principalmente almacenamiento local. En esta política llamamos «cookies» a ambos, porque se gestionan igual.',
        ],
      },
      {
        id: 'categorias',
        heading: 'Categorías',
        body: [
          {
            list: [
              'Necesarias: inicio de sesión, seguridad, sesión y funcionamiento básico. Se usan siempre porque sin ellas la plataforma no funciona.',
              'Funcionales: preferencias de interfaz. Solo se activan si las aceptas.',
              'Analíticas: medición de uso y rendimiento. Hoy no se usan.',
              'Marketing: publicidad y seguimiento comercial. Hoy no se usan.',
            ],
          },
          'Las categorías no necesarias permanecen desactivadas hasta que las aceptes, y ningún elemento de esas categorías se ejecuta antes.',
        ],
      },
      {
        id: 'inventario',
        heading: 'Elementos que usamos',
        body: [
          {
            table: {
              head: ['Nombre', 'Categoría', 'Para qué', 'Duración'],
              rows: [
                ['coreflow_supabase_auth_token', 'Necesaria', 'Mantiene tu sesión iniciada de forma segura (Supabase Auth)', 'Hasta cerrar sesión. Sin «Mantener sesión activa», hasta cerrar el navegador'],
                ['coreflow_active_organization', 'Necesaria', 'Recuerda la organización con la que trabajas', 'Hasta cerrar sesión'],
                ['coreflow_cookie_consent', 'Necesaria', 'Guarda tu decisión sobre cookies', '12 meses o hasta que cambie esta política'],
                ['coreflow_saas_relational_state_v3', 'Necesaria', 'Guarda los datos del entorno de demostración en tu navegador; no se usa con datos reales', 'Hasta borrar los datos del navegador'],
                ['coreflow_ui_theme', 'Funcional', 'Recuerda si prefieres el tema claro u oscuro', 'Hasta retirar el consentimiento'],
              ],
            },
          },
          'Además, la tipografía se descarga desde Google Fonts, que recibe la dirección IP del visitante. CoreFlow no instala cookies de Google para esto. [POR VALIDAR: valorar alojar la tipografía en los servidores propios para eliminar esta transmisión].',
        ],
      },
      {
        id: 'gestionar',
        heading: 'Cómo cambiar tu decisión',
        body: [
          'Puedes cambiar o retirar tu consentimiento en cualquier momento desde «Configuración de cookies», en el pie de página. Al retirarlo, borramos los datos que guardaba cada categoría rechazada.',
          'Tu decisión se guarda en este navegador. Si entras desde otro navegador o dispositivo, te la pediremos de nuevo. También puedes borrar el almacenamiento desde la configuración de tu navegador.',
          { action: 'cookie-preferences' },
        ],
      },
      {
        id: 'registro',
        heading: 'Registro de tu decisión',
        body: [
          'Guardamos un identificador aleatorio de la decisión, las categorías aceptadas y rechazadas, las versiones de esta política y del aviso, y la fecha. Este registro no incluye tu nombre, correo ni credenciales, y sirve para demostrar que obtuvimos tu consentimiento.',
        ],
      },
    ],
  },
  {
    slug: 'terminos',
    title: 'Términos y condiciones de uso',
    description: 'Reglas para usar CoreFlow, responsabilidades de Webcore y de las organizaciones clientes.',
    version: '2026-11-11-borrador',
    ...DRAFT,
    sections: [
      {
        id: 'objeto',
        heading: 'Objeto',
        body: [
          `Estos términos regulan el uso de CoreFlow, servicio prestado por ${P.legalName}. Las condiciones comerciales de cada organización (plan, precio, facturación, renovación y niveles de servicio) se rigen por su contrato o su orden de servicio. [POR VALIDAR: documento contractual y condiciones comerciales vigentes].`,
        ],
      },
      {
        id: 'cuentas',
        heading: 'Cuentas y acceso',
        body: [
          {
            list: [
              'Cada organización designa a sus administradores, que invitan a los usuarios y asignan sus roles.',
              'Cada usuario debe proteger su contraseña y avisar de inmediato si sospecha un acceso no autorizado.',
              'Las cuentas son personales. Los permisos dependen del rol asignado y de la suscripción de la organización.',
            ],
          },
        ],
      },
      {
        id: 'planes',
        heading: 'Planes y suscripción',
        body: [
          'Las capacidades disponibles dependen del plan contratado (por ejemplo, número de colaboradores, sedes o automatizaciones). Si la suscripción vence o se suspende, la organización conserva el acceso de consulta a su información, pero no puede crear ni modificar registros hasta regularizarla.',
          '[POR VALIDAR: precios, medios de pago, renovación, cancelación y reembolsos].',
        ],
      },
      {
        id: 'uso',
        heading: 'Uso aceptable',
        body: [
          {
            list: [
              'No intentar acceder a información de otras organizaciones ni eludir los controles de seguridad.',
              'No cargar contenido ilícito, malicioso o que infrinja derechos de terceros.',
              'No usar la plataforma para enviar comunicaciones no autorizadas.',
              'Registrar datos personales de terceros solo con la base legal y las autorizaciones correspondientes.',
            ],
          },
        ],
      },
      {
        id: 'datos-organizacion',
        heading: 'Información de la organización',
        body: [
          'La información que cada organización registra le pertenece. Frente a los datos personales que contiene, la organización actúa como responsable del tratamiento y Webcore como encargado.',
          'Esta relación debe constar en un acuerdo de tratamiento de datos (contrato de transmisión), en los términos del artículo 2.2.2.25.5.2 del Decreto 1074 de 2015. [POR VALIDAR: modelo de acuerdo de tratamiento de datos entre Webcore y sus clientes].',
        ],
      },
      {
        id: 'disponibilidad',
        heading: 'Disponibilidad y soporte',
        body: [
          'Webcore procura mantener el servicio disponible y seguro, pero puede haber interrupciones por mantenimiento o causas ajenas. [POR VALIDAR: niveles de servicio, horarios de soporte y canales de atención].',
        ],
      },
      {
        id: 'propiedad',
        heading: 'Propiedad intelectual',
        body: [
          'El software, la marca CoreFlow, su identidad visual y la documentación pertenecen a Webcore o a sus licenciantes. El uso del servicio no transfiere ningún derecho sobre ellos. [POR VALIDAR: estado de registro de la marca].',
        ],
      },
      {
        id: 'responsabilidad',
        heading: 'Responsabilidad',
        body: [
          '[POR VALIDAR: cláusula de limitación de responsabilidad, redactada y revisada por un abogado, compatible con la normativa de protección al consumidor cuando resulte aplicable].',
        ],
      },
      {
        id: 'terminacion',
        heading: 'Terminación',
        body: [
          'Al terminar la relación, la organización podrá solicitar una copia de su información dentro del plazo que fije el contrato. Después, la información se eliminará o se conservará solo en la medida en que una obligación legal lo exija. [POR VALIDAR: plazo y formato de entrega].',
        ],
      },
      {
        id: 'ley',
        heading: 'Ley aplicable',
        body: [
          `Estos términos se rigen por las leyes de la República de Colombia. Jurisdicción: ${P.jurisdiction}.`,
        ],
      },
    ],
  },
  {
    slug: 'tratamiento-datos',
    title: 'Política de tratamiento de datos personales',
    description: 'Política exigida por la Ley 1581 de 2012: finalidades, derechos, deberes y procedimiento para consultas y reclamos.',
    version: PRIVACY_POLICY_VERSION,
    ...DRAFT,
    sections: [
      {
        id: 'responsable',
        heading: 'Identificación del responsable',
        body: [
          {
            table: {
              head: ['Dato', 'Valor'],
              rows: [
                ['Razón social', P.legalName],
                ['NIT', P.taxId],
                ['Domicilio y dirección', P.address],
                ['Correo electrónico', P.privacyEmail],
                ['Teléfono', P.phone],
              ],
            },
          },
        ],
      },
      {
        id: 'marco',
        heading: 'Marco normativo',
        body: [
          'Esta política se elabora con referencia a la Ley 1581 de 2012 y al Decreto 1377 de 2013, compilado en el Decreto 1074 de 2015, así como a las instrucciones de la Superintendencia de Industria y Comercio. La Ley 1266 de 2008 aplica solo si se tratan datos de información financiera o crediticia, lo que CoreFlow no hace por defecto.',
          'Es un borrador sujeto a revisión jurídica. No constituye una declaración de cumplimiento pleno.',
        ],
      },
      {
        id: 'finalidades',
        heading: 'Tratamiento y finalidades',
        body: [
          'Webcore recolecta, almacena, usa y suprime datos personales para las finalidades descritas en la Política de privacidad: administrar cuentas, prestar el servicio, garantizar la seguridad, atender solicitudes y cumplir obligaciones legales.',
          'Cuando actúa como encargado de una organización cliente, Webcore trata los datos solo según las instrucciones de esa organización y para prestarle el servicio.',
        ],
      },
      {
        id: 'autorizacion',
        heading: 'Autorización',
        body: [
          'La autorización del titular debe ser previa, expresa e informada. Para las cuentas que Webcore administra, se solicita al crear o activar la cuenta. [POR VALIDAR: texto y mecanismo de autorización en el flujo de invitación y activación de cuentas, y conservación de la prueba].',
          'Las organizaciones clientes son responsables de obtener y conservar la autorización de los titulares cuyos datos registran en CoreFlow.',
          'No se requiere autorización en los casos previstos en la Ley 1581 de 2012, como la información requerida por una entidad pública en ejercicio de sus funciones o los datos de naturaleza pública.',
        ],
      },
      {
        id: 'derechos',
        heading: 'Derechos de los titulares',
        body: [
          {
            list: [
              'Conocer, actualizar y rectificar sus datos personales.',
              'Solicitar prueba de la autorización otorgada, salvo cuando no sea necesaria.',
              'Ser informado sobre el uso dado a sus datos.',
              'Presentar quejas ante la Superintendencia de Industria y Comercio, después de agotar el trámite de consulta o reclamo ante el responsable o el encargado.',
              'Revocar la autorización o solicitar la supresión cuando no se respeten los principios, derechos y garantías legales, y no exista un deber legal o contractual de conservar los datos.',
              'Acceder gratuitamente a sus datos personales.',
            ],
          },
        ],
      },
      {
        id: 'area',
        heading: 'Área responsable de atender solicitudes',
        body: [`${P.privacyArea}. Canal: ${P.privacyEmail}.`, { link: { label: 'Enviar una solicitud', href: '#/legal/derechos' } }],
      },
      {
        id: 'consultas',
        heading: 'Procedimiento para consultas',
        body: [
          'Las consultas se atienden en un máximo de diez (10) días hábiles desde su recibo. Si no es posible, se informa el motivo y la nueva fecha, que no puede superar cinco (5) días hábiles adicionales.',
        ],
      },
      {
        id: 'reclamos',
        heading: 'Procedimiento para reclamos',
        body: [
          {
            list: [
              'El reclamo debe incluir la identificación del titular, la descripción de los hechos, la dirección de respuesta y los documentos que se quieran hacer valer.',
              'Si está incompleto, se pide completarlo dentro de los cinco (5) días siguientes. Si pasan dos (2) meses sin respuesta del titular, se entiende que desistió.',
              'Una vez completo, se marca en la base de datos como «reclamo en trámite» en un máximo de dos (2) días hábiles.',
              'Se atiende en un máximo de quince (15) días hábiles desde el día siguiente a su recibo, prorrogables hasta ocho (8) días hábiles más, informando el motivo.',
            ],
          },
          'Cuando la solicitud se refiere a datos que administra una organización cliente, Webcore la traslada a esa organización y lo informa al titular.',
        ],
      },
      {
        id: 'supresion',
        heading: 'Supresión y conservación',
        body: [
          'La supresión no procede cuando el titular tiene un deber legal o contractual de permanecer en la base de datos, ni cuando la información debe conservarse por obligaciones legales, contractuales o de auditoría. CoreFlow no elimina automáticamente información sujeta a esos deberes.',
        ],
      },
      {
        id: 'transmision',
        heading: 'Transmisión y transferencia',
        body: [
          'Webcore transmite datos a sus proveedores de infraestructura bajo contratos que fijan el alcance del tratamiento. Cuando presta el servicio a una organización cliente, la relación debe constar en un contrato de transmisión según el artículo 2.2.2.25.5.2 del Decreto 1074 de 2015.',
          '[POR VALIDAR: análisis de las transmisiones internacionales a Estados Unidos y de los contratos con Supabase, Vercel y Google].',
        ],
      },
      {
        id: 'rnbd',
        heading: 'Registro Nacional de Bases de Datos',
        body: [
          'La inscripción en el Registro Nacional de Bases de Datos es obligatoria para sociedades y entidades sin ánimo de lucro con activos totales superiores a 100.000 UVT, y para las personas jurídicas de naturaleza pública. [POR VALIDAR: si Webcore está obligada a inscribir sus bases de datos].',
        ],
      },
      {
        id: 'vigencia',
        heading: 'Vigencia y cambios',
        body: [
          `Esta política rige desde ${P.effectiveDate}. Los cambios sustanciales se comunicarán a los titulares antes de aplicarse.`,
        ],
      },
    ],
  },
  {
    slug: 'aviso-legal',
    title: 'Aviso legal',
    description: 'Identificación del proveedor del servicio y condiciones de uso de este sitio.',
    version: '2026-11-11-borrador',
    ...DRAFT,
    sections: [
      {
        id: 'proveedor',
        heading: 'Proveedor del servicio',
        body: [
          {
            table: {
              head: ['Dato', 'Valor'],
              rows: [
                ['Razón social', P.legalName],
                ['NIT', P.taxId],
                ['Domicilio', P.address],
                ['Registro mercantil', P.registry],
                ['Representante legal', P.representative],
                ['Correo electrónico', P.privacyEmail],
                ['Teléfono', P.phone],
              ],
            },
          },
        ],
      },
      {
        id: 'objeto',
        heading: 'Objeto del sitio',
        body: [
          'Este sitio da acceso a CoreFlow, plataforma para la gestión de clientes, solicitudes, tareas, documentos y procesos de organizaciones.',
        ],
      },
      {
        id: 'propiedad',
        heading: 'Propiedad intelectual',
        body: [
          'Los contenidos, el software, la marca y la identidad visual de CoreFlow pertenecen a Webcore o a sus licenciantes. No se permite su reproducción sin autorización.',
        ],
      },
      {
        id: 'comunicaciones',
        heading: 'Comunicaciones electrónicas',
        body: [
          'Los mensajes de datos intercambiados a través de la plataforma tienen los efectos que les reconoce la Ley 527 de 1999, cuando resulte aplicable. [POR VALIDAR: alcance de las notificaciones electrónicas en el contrato].',
        ],
      },
      {
        id: 'ley',
        heading: 'Ley aplicable',
        body: [`Este aviso se rige por las leyes de la República de Colombia. Jurisdicción: ${P.jurisdiction}.`],
      },
    ],
  },
]

export const getLegalDocument = (slug) => LEGAL_DOCUMENTS.find((d) => d.slug === slug) || null

export const RIGHTS_REQUEST_TYPES = Object.freeze([
  { id: 'consulta', label: 'Consultar mis datos' },
  { id: 'actualizacion', label: 'Actualizar o rectificar mis datos' },
  { id: 'supresion', label: 'Suprimir mis datos' },
  { id: 'revocatoria', label: 'Revocar mi autorización' },
  { id: 'reclamo', label: 'Presentar un reclamo' },
])
