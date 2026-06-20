---
name: naiguata-expeditions
description: Landing page premium y consola privada de operaciones para la coordinación de excursiones de montaña al Pico Naiguatá.
---

# naiguata-expeditions

## Overview
Este proyecto contiene la landing page pública y la consola de administración privada para Expediciones Naiguatá. El diseño visual general debe ser premium, moderno, optimizado para UI/UX y con un flujo operativo automatizado para el guía.

## Infraestructura y Arquitectura (100% Gratis y Autónomo)
El Agente debe configurar la lógica del backend utilizando las siguientes herramientas gratuitas que no requieren configuraciones manuales de servidores ni llaves API complejas de correo:
- **Base de Datos:** Configurar la persistencia de datos de los inscritos (contacto, salud, grupo, fecha seleccionada) utilizando el plan gratuito de Supabase.
- **Notificación Directa por WhatsApp:** Generar un mensaje al administrador al correo `diego.morono03@gmail.com` estructurado y limpio del registro del usuario, actuando como la alerta principal de nueva inscripción en tiempo real para el guía, al cliente finalizar el formulario.
- **Notificación por Email (EmailJS):** Implementar envío automático simultáneo mediante la librería de EmailJS.
  - **Service ID:**
  - **Template ID:**
  - **Public Key:**
  - **Acción:** El Agente debe crear un template HTML profesional y configurar la función de envío en `app.js` utilizando variables dinámicas (`{{nombre}}`, `{{fecha}}`, `{{alquileres}}`, etc.). El código debe ser limpio, funcional y autónomo.

## Seguridad y Gestión de Credenciales (Protección de API Keys)

### 1. Ofuscación de Entorno y Variables Privadas
Queda estrictamente prohibido escribir de forma explícita contraseñas, llaves maestras o contraseñas de administración (como la clave del panel `/admin` o el token de Supabase) directamente en el código fuente de los archivos `app.js` o `index.html`. El sistema debe procesar las credenciales utilizando la arquitectura de variables de entorno del hosting.
- **Inyección en Vercel:** Durante el despliegue, el Agente debe programar el script para que consuma las credenciales desde `process.env.SUPABASE_ANON_KEY` y `process.env.ADMIN_PASSWORD_HASH`.
- **Mecanismo de Respaldo Local:** Para flujos de desarrollo local en entorno cliente, el script de autenticación del panel de administración (`/admin`) debe comparar el hash de la contraseña ingresada mediante funciones nativas de encriptación ligera (`crypto.subtle` o hashing básico) en lugar de una comparación de texto plano como. Esto evita que la clave sea visible al inspeccionar el código fuente del navegador.

### 2. Restricción de Acceso a Tablas Críticas
- **Políticas de Seguridad de Supabase (RLS):** La tabla `registrations` debe configurar políticas de seguridad de nivel de fila (Row Level Security). Los usuarios anónimos desde el formulario público únicamente tienen permisos exclusivos de escritura (`INSERT`). Los permisos de lectura (`SELECT`), edición (`UPDATE`) y borrado (`DELETE`) quedan restringidos únicamente para el rol autenticado del administrador del tour.

## Usage
Para ejecutar y probar este proyecto de forma local o en desarrollo, sigue estas instrucciones:
1. Instala las dependencias del proyecto (si aplica) ejecutando en la terminal: `npm install`
2. Levanta el servidor de desarrollo local con el comando: `npm run dev` o abre directamente el archivo `Website/index.html` utilizando la extensión Live Server.
3. Para compilar y generar la versión de producción optimizada para Vercel, ejecuta: `npm run build`
4. Asegúrate de verificar las variables de entorno en la consola de Vercel antes de realizar el despliegue definitivo a producción.

## Directrices Globales de Diseño (UI/UX de Cumplimiento Estricto)
1. **Estilización Absoluta de Desplegables:** Queda estrictamente prohibido el uso de estilos por defecto del navegador para las etiquetas `<select>` y menús desplegables. Deben utilizar componentes estilizados con fondo oscuro, bordes suavizados y tipografía premium.
2. **Prohibición de Markdown en la UI:** El contenido debe entregarse exclusivamente mediante etiquetas semánticas de HTML5. El formato visual (negritas, tamaños, espaciados) debe ser aplicado íntegramente a través de reglas CSS.
3. **Feedback Visual Inmediato (Estados de Carga):** Todo botón de acción (Enviar, Guardar, Descargar) debe implementar un estado visual de carga (loading state) al ser presionado, deshabilitando el clic múltiple para evitar registros duplicados en Supabase.
4. **Diseño "Mobile-First" Adaptativo:** La interfaz debe ser funcional y elegante en dispositivos móviles. Evitar elementos de ancho fijo; utilizar flexbox o grid para que los componentes (especialmente el formulario y el panel de administración) se ajusten automáticamente al tamaño de la pantalla.
5. **Consistencia de Tipografía y Espaciado:** El Agente debe definir un sistema de diseño (design system) sencillo en CSS: una fuente principal moderna (ej: Inter o Montserrat), paleta de colores coherente y un uso consistente de "padding" y "margin" para evitar interfaces desordenadas.

## Directrices de la Interfaz Pública (Secciones 1 a 4)
1. **Hero Principal y Conversión BCV:** Consumo automatizado en `app.js` de una API pública de código abierto o scraping confiable para obtener el tipo de cambio oficial del Banco Central de Venezuela (BCV) en tiempo real. Multiplicar dinámicamente este factor por los $50 USD del costo del tour para reflejar el monto exacto en Bolívares (Bs.) dentro de la interfaz del Hero.
  ### 1 Lógica de Contingencia para Tasa BCV (Protección Cambiaria)
  Para mitigar el riesgo de fallos por bloqueo de CORS, latencia o cambios de estructura en la web del BCV, el sistema implementará un algoritmo de tres capas de seguridad para garantizar que la tasa en Bolívares (VES) nunca quede obsoleta:
  1. **Capa 1 (Consumo Dinámico Localizado):** El script `app.js` intentará consultar una API intermedia de código abierto o un repositorio espejo automatizado que sirva la tasa oficial del día.
  2. **Capa 2 (Última Tasa Válida Conocida - Base de Datos):** Si la consulta en tiempo real falla o se agota el tiempo de espera (Timeout > 3 segundos), el frontend realizará una consulta rápida a una tabla persistente en Supabase llamada `system_settings`, de donde extraerá el campo `last_valid_bcv`. Esta tasa representa el último valor exitoso registrado en el sistema.
  3. **Capa 3 (Hardcode de Emergencia y Alerta del Sistema):** Si por fallas críticas de red global o caída del servidor el script en el cliente no logra conectarse con la API externa ni con la base de datos de Supabase, se activará un modo de contingencia estricto. En este instante exacto, para evitar que el negocio opere con una tasa obsoleta sin supervisión, el frontend disparará una acción de contingencia dual: enviará una notificación silenciosa al administrador mediante el servicio de EmailJS (usando las credenciales activas) y la API de Whatsapp (enviando un mensaje de texto estricto al número +34673375681) con el asunto "ALERTA: Sistema Naiguatá en Modo de Emergencia - Fallo de Conexión Base de Datos/BCV" y preparará una advertencia visual exclusiva en la consola para que el guía sepa que debe revisar el estado de sus plataformas de inmediato. 
  
  - **Panel de Control de Emergencia (UI Administrador en `/admin`):**
  La pestaña de ajustes financieros contará con una tarjeta de edición rápida para la tasa de cambio. 
  * **Campo Dinámico:** Un input numérico conectado directamente al campo `last_valid_bcv` en Supabase.
  * **Acción Operativa:** Si el guía nota que el dólar oficial subió drásticamente y las APIs automáticas fallaron, podrá ingresar manualmente la tasa del día con un clic en **[Forzar Actualización de Tasa]**, impactando de inmediato en el cálculo de Bolívares de todos los formularios públicos activos.

2. **Acceso Restringido de "Panel de Guía" del menú de navegación público.** El acceso a la administración será privado y restringido de forma exclusiva a través de la ruta web hija configurada en Vercel: `https://naiguata-expeditions.vercel.app/admin`.
3. **Planificador de Equipaje:** Diseño balanceado 50/50 en dos columnas ordenadas por kits compactos desplegables unida a `localStorage`.
4. **Formulario de Registro:** Implementar el selector de fecha inteligente mostrando los próximos Sábados disponibles.

## 📦 Módulo de Inventario y Alquileres (Gestión de Stock)
### 1. Estructura de Inventario
El sistema gestiona la tabla `inventory_stock` en Supabase con los campos: `item_id`, `item_name`, `total_quantity` y `price_usd`.
- **Inventario Actual:**
  - Saco de Dormir (0-10°C): Stock inicial 4 | Precio $10
  - Esterilla/Aislante: Stock inicial 5 | Precio $5
  - Poncho Impermeable: Stock inicial 10 | Precio $5
  - Linterna Frontal: Stock inicial 2 | Precio $5
  - Linterna de Tienda: Stock inicial 4 | Precio $5
  - Mochila de Travesía (35L): Stock inicial 1 | Precio $10

### 2. Lógica de Reservas Inteligente
- **Validación en tiempo real:** Al seleccionar la fecha, el formulario consulta `inventory_stock` frente a las reservas ya confirmadas en `registrations` para esa fecha.
- **Visualización:** El usuario ve un selector con los ítems disponibles y un indicador dinámico: *"Disponibilidad para esta fecha: X unidades restantes"*.
- **Bloqueo:** Si `total_quantity - reservados == 0`, el ítem se marca como `disabled` y se muestra "Agotado".

## 📊 Módulo de Asignación Inteligente de Inventario y Split de Ganancias (Maximización de Margen)

### 1. Arquitectura de Propiedad en la Tabla `inventory_stock`
Para optimizar la rentabilidad de Expediciones Naiguatá, el inventario del sistema se dividirá internamente mediante dos nuevas columnas numéricas en Supabase: `owned_qty` (unidades propiedad de Admin) y `consignment_qty` (unidades prestadas por terceros). 
- **Matriz de Priorización de Alquileres:** Cuando un cliente solicita equipos en el Paso 3, el script de asignación aplicará una lógica de descuento secuencial: primero consumirá el stock de `owned_qty`. Solo cuando `owned_qty == 0`, el sistema empezará a comprometer las unidades de `consignment_qty`. 
- **Modelado de Inventario Base:**
  - Saco de Dormir (0-10°C): Stock total 4 | `owned_qty: 1` | `consignment_qty: 3` | Precio $10
  - Esterilla/Aislante: Stock total 6 | `owned_qty: 6` | `consignment_qty: 0` | Precio $5
  - Poncho Impermeable: Stock total 10 | `owned_qty: 10` | `consignment_qty: 0` | Precio $5
  - Linterna Frontal: Stock total 2 | `owned_qty: 2` | `consignment_qty: 0` | Precio $5
  - Linterna de Tienda: Stock total 4 | `owned_qty: 4` | `consignment_qty: 0` | Precio $5
  - Mochila de Travesía (35L): Stock total 1 | `owned_qty: 0` | `consignment_qty: 1` | Precio $10

### 2. Algoritmo de Despacho Logístico de Carpas (Mitigación de Costo Operativo)
El uso de carpas de terceros penaliza el flujo de caja con un costo fijo de $10 USD (pagaderos a tasa BCV) hacia el proveedor externo. Por lo tanto, el sistema automatizará la distribución de pernocta en el Paso 1 bajo un estricto orden de prelación basado en la capacidad solicitada por los grupos de excursionistas.
- **Flota de Carpas Registrada:**
  - Flota Propia (Diego): 1 Carpa (2 personas), 1 Carpa (3 personas), 1 Carpa (4 personas).
  - Flota Externa (Terceros): 2 Carpas (2 personas).
- **Regla de Optimización en `/admin`:** Al consolidar las carpas para la fecha de la expedición, la consola del administrador ejecutará una función de emparejamiento que llenará primero las carpas propias según el volumen de personas registradas. Las carpas externas permanecerán bloqueadas en reserva y el sistema solo sugerirá su uso si la capacidad de la flota propia se ve completamente desbordada por la cantidad de participantes.

### 3. Reporte de Cierre y Liquidación (Split de Caja en Panel `/admin`)
Para evitar confusiones contables al finalizar el tour, la pantalla de finanzas calculará automáticamente la división del dinero recaudado en la expedición.
- **Cálculo Automatizado:** El sistema leerá los IDs de los ítems de alquiler y carpas despachadas que pertenecían a `consignment_qty` o a la flota externa. 
- **Métricas de Balance:** La UI presentará de forma explícita dos contenedores financieros: 
  * **"Ingreso Neto Naiguatá Expeditions":** Tarifa base + utilidades por el alquiler de activos propios.
  * **"Cuentas por Pagar Proveedores (Tasa BCV)":** Sumatoria exacta del 100% del costo de alquiler de sacos consignados y los $10 USD por cada carpa externa utilizada, generando el monto exacto que debes transferirle a la otra persona para cerrar la logística impecablemente.


## 🍎 Módulo de Catering y Snacks
### 1. Estructura de Inventario de Comida
El sistema gestiona la tabla `catering_inventory` en Supabase. Dado que todos los productos son de rápida adquisición/preparación, todos cuentan con **stock ilimitado**.

- **Productos:**
  - Dulce de guayaba: Precio $2
  - Barra Energética: Precio $2.5
  - Mix de frutos secos (100g): Precio $4

### 2. Lógica de Pedidos
- **Resumen de Producción:** La Consola de Operaciones (`/admin`) debe sumar todas las raciones pedidas por cada fecha específica, generando un total de "Lista de Compras/Preparación" para que el guía sepa qué adquirir o preparar antes de la salida.

## 🧳 Módulo de Logística y Portadores (Gestión de Carga)
### 1. Estructura de Servicios
El sistema gestiona la disponibilidad del personal de apoyo logístico. A diferencia de los alquileres de equipo, este módulo ofrece servicios vinculados al tipo de carpa asignada al participante, registrándose en la tabla `logistic_services` en Supabase con los campos: `service_id`, `service_name` y `price_usd`.
- **Tarifas de Transportación:**
  - Servicio de Portador para Carpa de 2 personas: Precio $30 USD
  - Servicio de Portador para Carpa de 3 personas: Precio $40 USD
  - Servicio de Portador para Carpa de 4 personas: Precio $50 USD

### 2. Lógica de Selección Unificada
- **Vinculación de Pasos:** El sistema identifica la carpa asignada al cliente en el Paso 1. Al llegar al Paso 3, este módulo le presenta la opción de delegar la carga de forma exclusiva para ese tamaño de carpa.
- **Opción por Defecto:** La opción seleccionada por defecto es "No, yo mismo cargaré mi carpa asignada ($0 USD)", obligando al usuario a interactuar de forma consciente si desea cambiarla para evitar malentendidos sobre el esfuerzo físico requerido.

### 3. Integración en Notificación
- **Consola de Operaciones (/admin):** La interfaz de administración cruza los datos de salud del Paso 2 con la solicitud de portador del Paso 3, alertando visualmente al guía en el panel sobre qué carpas deben entregarse directamente al staff logístico en La Julia y cuáles se distribuyen entre los excursionistas.

## 📲 Módulo de Totalización, Despacho por WhatsApp y Modal de Éxito Final
### 1. Lógica Centralizada de Suma Total
El sistema ejecuta una función unificada de cálculo (`calcularTotalExpedicion()`) cada vez que el usuario interactúa con cualquier selector de los tres módulos logísticos en el Paso 3.
- **Ecuación de Cierre:** El precio final se compone de la siguiente estructura acumulativa:
  - Tarifa Base del Tour: $50 USD fijo por participante.
  - Subtotal Alquileres: Sumatoria dinámica de ítems seleccionados de la tabla `inventory_stock`.
  - Subtotal Snacks/Catering: Sumatoria de raciones multiplicadas por su precio unitario en `catering_inventory`.
  - Subtotal Carga: Monto fijo de la tarifa seleccionada según la tabla `logistic_services`.
- **Actualización de UI:** El total general se despliega en tiempo real en la parte inferior del formulario mediante un contenedor flotante con el "costo Base del Tour + Adicionales = Total a Pagar".

### 2. Estructura del Mensaje de Alerta (Notificación al Administrador vía WhatsApp)
Al presionar el botón de envío, el script procesa y almacena el registro en la base de datos de Supabase. De forma inmediata, el sistema prepara el formato de despacho para notificar al administrador (coordinador de Expediciones Naiguatá) con un email con todos los datos del registro. Queda estrictamente prohibido incluir el texto del manual aquí para no saturar la URL de la API.
- **Formato del Mensaje:**
  > ⛰️ **NUEVA INSCRIPCIÓN - EXPEDICIONES NAIGUATÁ** ⛰️
  > - Excursionista: [Nombre Completo, Teléfono, Correo, Código Grupo, Género]
  > - Carpa Asignada: [Preferencia seleccionada en Paso 1]
  > - Alquileres: [Todos los ítems elegidos o "Ninguno"]
  > - Snacks: [Todas las raciones solicitadas o "Ninguno"]
  > - Portador de Carpa: [Servicio contratado o "Ninguno - Carga el cliente"]
  > 💰 **TOTAL GENERAL A PAGAR:** $[Suma Total] USD
  > _Confirma datos de pago._

- **Flujo de Usuario:** El cliente permanece en la plataforma web visualizando su Modal de Éxito, mientras que el sistema gestiona el envío del resumen comercial hacia el canal del administrador.

### 3. Flujo Automático Inmediato e Interfaz del Modal de Éxito (Centro de Descarga Unificado)
A diferencia de los sistemas con aprobaciones bloqueantes, este software prioriza la experiencia de usuario (UX) permitiendo el acceso inmediato al material informativo y de respaldo. El orden cronológico de eventos opera de la siguiente manera:
1. **Registro y Pago Asistido:** El cliente completa sus datos, visualiza los datos fijos de recaudación, e ingresa su número de referencia obligatorio.
2. **Inyección Inmediata:** Al presionar el botón de envío, el script guarda los datos en Supabase con el estatus inicial `🟡 Pendiente por Verificar` y, sin esperar validación humana, desbloquea de forma instantánea el Modal de Éxito en pantalla.
3. **Centro de Descarga Unificado (Acceso Post-Registro):** Este espacio actúa como el contenedor definitivo de documentos y herramientas de respaldo offline para el participante desde el primer instante:
    - **Botón [Descargar]:** Ejecuta la generación y descarga unificada de un archivo (PDF o PNG de alta calidad). La página muestra el Pase de Expedición con el resumen de los datos del cliente y el desglose de sus montos.
    - **Botón [Compartir Aventura / Respaldo]:** Botón dual inteligente con Web Share API. Permite al usuario copiar un texto estético de su viaje para redes sociales o enviar directamente el PDF/PNG generado con el Manual y el Pase hacia su propio chat de guardados en Telegram o WhatsApp como respaldo offline para la montaña.
    - **Botón [Descargar Manual del Tour]:**Ejecuta la generación y unificada de un archivo (PDF o PNG de alta calidad) donde renderiza íntegramente el contenido oficial del "Manual del Tour".
4. **Auditoría Posterior:** El administrador, a su propio ritmo a través de la consola privada `/admin`, revisa las referencias y presiona **[Confirmar Pago ✅]**, lo que muta el estado en la base de datos a `🟢 Confirmado`.

## Directrices del Flujo de Confirmación (Sección 5)
## 💻 Frontend (Registro Público - index.html)
- **Ubicación del Formulario:** Se ubicará después del componente "Planificador de Equipaje" y antes del Footer.
- **Flujo de Datos (UX):**
    1. **Datos Personales:** Identificación del senderista (Nombre y Apellido, Celular, Correo Electrónico, ¿Vienes con alguien más? (Código de Grupo), Género, Preferencia de Alojamiento (carpa de 2 personas, carpa de 3 personas o carpa de 4 personas)).
    2. **Selector de Fecha:** Sábados disponibles.
    3. **Seguridad:** Campo obligatorio de "Información de Salud Crítica" (alergias/condiciones).
    4. **Módulo Unificado de Provisiones:** Checklist de Equipos, Snacks y Portador de Carpas (sección de "Alquileres y Provisiones, ").
    5. **Módulo de Pagos Simplificado (Flujo Rápido sin APIs Externas):**
        - *Lógica de Operación:* Para evitar dependencias, burocracia o aprobaciones institucionales con plataformas de pago, el sistema operará mediante verificación de datos y referencias manuales/asistidas, agilizando el despliegue del software.
        - *Pago Móvil (VES):* El formulario desplegará de forma dinámica los datos fijos de recepción del administrador:
            El sistema calculará automáticamente el monto en Bolívares usando la tasa BCV del día reflejada en el Hero. El cliente completará la transferencia desde su banco e ingresará obligatoriamente el "Número de Referencia" de la transacción para procesar su registro.
        - *Cripto (USDT con Binance Pay):* El sistema mostrará en pantalla las credenciales directas de la cuenta:
            - **Diseño de Interfaz (UI):** Emergerá un cuadro visual con los datos (Correo: thecardanomerch@gmail.com)
            El cliente realizará la transferencia directa de app a app e ingresará su ID de usuario o número de comprobante de Binance como campo de validación.
        - *Dólares Manuales (Zelle / Efectivo):* 
            - Si selecciona "Zelle", emergerá un cuadro visual con los datos (Titular: Diego Moroño | Correo: diego.morono03@gmail.com) y un input obligatorio para el "Número de Referencia".
            - Si selecciona "Efectivo", el sistema le indicará que el pago se entregará en persona el día de la salida y dejará el registro completado.
        - *Estado en Base de Datos:* Toda transacción procesada por estos métodos ingresará a la tabla `financial_transactions` con el estatus `🟡 Pendiente por Verificar`. Al administrador le aparecerá una alerta visual en su Consola Privada donde, con un solo botón de **[Aprobar Pago]**, cambiará el estatus a `🟢 Confirmado`, actualizando automáticamente las métricas y los saldos de caja del tour.
        "Queda prohibido hardcodear datos financieros del guía. El sistema debe realizar una petición asíncrona a la tabla system_settings de Supabase al cargar la aplicación y poblar dinámicamente los campos de Pago Móvil, Binance Pay y Zelle en la interfaz del cliente".
- **Persistencia:** Conexión directa vía HTTP a Supabase usando la `Anon Key`.

### 🔍 Módulo de Sanitización, Normalización de Texto y Máscaras de Entrada
Para mantener la base de datos impecable, estandarizada y libre de caracteres corruptos o strings maliciosos (SQL Injection/XSS), el script aplicará filtros estrictos de entrada antes de procesar cualquier variable.
- **Formateo Automatizado en Clientes:** El campo de número de teléfono aplicará una máscara en tiempo real obligando al formato internacional legible (ej. +58-412-0000000). Los campos de texto destinados a nombres propios o correos electrónicos serán procesados nativamente mediante las funciones `.trim()` para eliminar espacios huérfanos en los extremos y convertidos automáticamente a formato tipo título (Title Case) o minúsculas estrictas según corresponda. Esto garantiza que las consultas de búsqueda en la consola `/admin` funcionen perfectamente sin fallos por discrepancias de mayúsculas o caracteres extraños.

1. **Modal de Éxito:** Únicamente tres acciones premium:
   - **[Descargar]**: Ejecuta la generación y descarga (en formato PDF o PNG de alta calidad) del Pase de Expedición con todos los datos registrados del cliente.
   - **[Compartir Aventura / Respaldo]:** Botón inteligente con lógica de detección de dispositivo:
     - **Acción Estética:** Al hacer clic, abre un menú que permite:
       a) **Copiar invitación:** Copia al portapapeles un texto con todos los datos del registro del cliente para compartir en Whatsapp.
       b) **Integración de Archivos:** Si el navegador lo permite, dispara la función de "Compartir" nativa del sistema operativo (Share API) para enviar el PDF/PNG generado directamente a tu Telegram/WhatsApp de guardados.
    - **[Descargar Manual del Tour]**: Ejecuta la generación y descarga (en formato PDF o PNG de alta calidad) del documento estructurado del Manual del Tour adjunto abajo.
### 🛠️ Módulo de Resiliencia Frontend y Almacenamiento Persistente en Borrador (LocalStorage)
Para ofrecer una experiencia de usuario sumamente profesional, el formulario debe proteger el progreso del cliente ante interrupciones inesperadas como pérdidas de conexión a internet o recargas accidentales de la página.
- **Persistencia en Tiempo Real:** El script de `app.js` escuchará el evento `input` en todos los campos del formulario públicos (Paso 1 al Paso 4) para guardar automáticamente una copia cifrada o limpia de los datos en el `localStorage` del navegador. Si la página se refresca en plena mitad del registro, el sistema restaurará de forma transparente toda la información previamente ingresada.
- **Mecanismo de Desconexión (Offline First):** Si al momento de presionar el botón de envío el cliente no cuenta con conexión de red, el botón se transformará visualmente mostrando el estado "Guardando localmente... Esperando conexión" y pausará la petición utilizando un bucle de reintentos con retraso exponencial (Exponential Backoff). Una vez que el dispositivo recupere el acceso a internet, el script inyectará los datos pendientes en Supabase de forma autónoma sin obligar al usuario a rellenar el formulario nuevamente.

### Contenido Oficial para el Manual del Tour (A integrar en la Descarga)
El Agente debe formatear este texto con tipografía elegante y espaciados limpios en la segunda página del archivo descargable:
- **Título:** Manual del Tour: Acampada Nocturna al Pico Naiguatá (2.765 m) - Servicio Guiado. Precio: $50 USD.
- **1. Itinerario Aproximado (Sujeto a clima y ritmo del grupo):**
  - *1er Día - 07:30:* Punto de encuentro en sendero La Julia e inicio del ascenso. Ascenso: ~8-10 horas con paradas (desnivel ~1.800-1.900 m, distancia ~8-9 km ida). Paradas: La Julia, El Tanque, Rancho Grande, Anfiteatro (Instalación de carpas, cena). *Posible ascenso corto a cumbre para atardecer si hay luz y energía.
  - *2do Día - Madrugada:* Ascenso a cumbre para amanecer (vistas 360° Caracas y el Caribe). 06:00-07:00: Fotos, desayuno ligero. Descenso: ~5-7 horas (~8-9 km). 14:00-16:00: Regreso aproximado a Caracas.
  - *Totales:* Duración total ruta: ~17-18 km ida/vuelta | Dificultad: Exigente (buena condición física requerida).
- **2. Lo que nosotros proveemos (Incluido en el costo):** Guía experimentado durante todo el recorrido, orientación en ruta, manejo de grupo, snacks ligeros y carpas limpias y cómodas (El préstamo es gratuito, pero su transporte a la cumbre no se incluye, salvo que se contrate el servicio de portador de carpas).
- **3. Lista oficial de lo que DEBES llevar (Responsabilidad personal, empacar ligero en mochila de 30-45 L):**
  - *Hidratación (Imprescindible):* 3-4 litros de agua mínimo por persona (camelbak o botellas). Hay puntos de agua en ruta (La Julia, El Tanque, Anfiteatro), pero no dependas 100% – lleva suficiente para ascenso y noche.
  - *Comida y Energía:* Snacks para todo el día (frutos secos, mínimo 2 barritas energéticas), frutas (manzanas, cambures), almuerzo/cena listo para consumir (sandwich, fajitas, pasta fría), desayuno ligero (galletas, pan) y extras (chocolates, gomitas, electrolitos).
  - *Ropa y Capas (Clima variable):* Ropa de caminata transpirable, suéter/polar (capa media), chaqueta impermeable/poncho (obligatorio), cortavientos. Para la noche/cumbre: gorro, guantes, ropa térmica o pijama, calcetines extras. Gorra para el sol y zapatos con buen agarre (imprescindible).
  - *Equipo para Dormir:* Saco de dormir (rating 0-5°C ideal, temperaturas nocturnas ~5-10°C) y esterilla/aislante/mat de yoga (imprescindible para suelo frío y rocoso) NOTA: Si no contrataste el servicio logístico de portador, debes prever un espacio físico considerable en tu mochila (o externalizado mediante amarres técnico-tácticos) para transportar la carpa asignada por el guía.
  - *Seguridad y Básicos:* Linterna (para noche/madrugada), protector solar FPS 50+, repelente, papel higiénico, bolsas plásticas para basura, celular + power bank y botiquín personal (curitas, analgésicos, pastillas para mal de altura).
- **4. Reglas de Seguridad y Regulaciones (Parque Nacional Waraira Repano):** Prohibido estrictamente hacer fogatas o fuego abierto. No dejar basura, no dañar la flora/fauna, caminar siempre por el sendero. Respetar el ritmo colectivo del grupo y avisar de inmediato si te sientes mal. Informar a familiares del itinerario.
- **5. Protocolo de Emergencias:** El guía lleva botiquín completo. Números clave: Emergencia 171, Guardaparques 04143383081. Ruta de evacuación: descenso por el mismo sendero.
- **6. Consejos Finales del Guía:** Prueba todo antes (zapatos, mochila, saco). Prepárate físicamente con caminatas previas. Duerme bien la noche anterior e hidrátate los días previos. La meta es cumbre segura y amanecer inolvidable.

---

## 🛠️ Sección 6: Consola Privada de Operaciones (Panel del Guía)
Diseño completo del panel administrativo, implementando una lógica de control global por fechas:

### 1. Panel de Control Superior (Filtro Maestro)
- **Tarjetas de Salidas Próximas:** Componente visual interactivo (tipo "Carrusel" o "Grid") que muestra las próximas expediciones.
    - **Acción:** Cada tarjeta funciona como un "botón de un solo clic" que activa el **Filtro Maestro**.
    - **Contenido de la tarjeta:** Fecha, nombre del evento y estado del semáforo (🟢/🔴).
    - **Reactividad:** Al hacer clic en una tarjeta, esta se resalta como "Seleccionada" y el resto de la página (Roster, Inventario, Catering, Reportes) se actualiza instantáneamente con la información de esa fecha específica.
- **Manejo de Historial:** Controles globales adicionales para segmentar por rango de fechas o histórico completo.
- **Métricas Clave:** Tarjetas superiores que muestran los totales (senderistas, grupos, recaudación y resúmenes operativos) correspondientes a la fecha seleccionada en el filtro.

## 2. Roster Oficial de Excursionistas (Vista Agregada)
- **Tabla Operativa:** Al seleccionar la fecha en el Panel Maestro, la tabla muestra: Nombre, Contacto (WhatsApp), Grupo, Género, Salud.
- **Columnas Dinámicas:** Se añaden automáticamente columnas para:
    - **Inventario Rentado:** Detalle de equipos por participante.
    - **Snacks/Comida:** Detalle de ítems de catering por participante.
    - **Estado y Método de Pago (Monitoreo Global):** Columna que renderiza un badge visual dinámico según el método elegido y el estatus actual en Supabase:
        - `🟢 Confirmado` (Para pagos que ya revisaste y aprobaste).
        - `🟡 Pendiente por Verificar` (Estado inicial para todo registro que ingrese por Pago Móvil, Binance o Zelle en espera de tu validación).
        - Debe mostrar explícitamente el método (ej: *Pago Móvil*, *Binance*, *Zelle*, *Efectivo*) y el monto total cobrado (Tour Base + Alquileres + Catering).
- **Controles de Administrador:** Acciones de **Editar (✏️)** y **Eliminar (🗑️)** por fila, con recálculo automático de totales al modificar cualquier dato.
- **Flag de Alerta Crítica:** El sistema debe evaluar el campo Información de Salud Crítica. Si el campo no está vacío, la fila correspondiente en la tabla del Roster debe resaltar automáticamente con un background o un ícono de advertencia (🔴) de color rojo brillante, garantizando visibilidad inmediata del riesgo médico sin necesidad de abrir la vista de edición.
- **Módulo de Conciliación General (Validación de Referencias):**
    - Todas las filas del Roster con registros en estado `🟡 Pendiente por Verificar` deben mostrar un botón de acción prioritario **[Validar Pago]**.
    - Al presionarlo, se abrirá un modal flotante con los datos de auditoría aportados por el cliente desde el formulario público (Método de pago, Número de Referencia ingresado o ID de usuario).
    - **Acciones del Administrador:**
        1. **Botón [Confirmar Pago ✅]:** Actualiza la transacción en Supabase a `🟢 Confirmado`, suma los montos netos a los balances de caja correspondientes, dispara la generación del Pase de Expedición con QR e inicia el envío del correo de bienvenida automatizado por EmailJS.
        2. **Botón [Rechazar Registro ❌]:** Cambia el estado a "Cancelado" o elimina la fila en Supabase, liberando de forma inmediata y automática los equipos de inventario y las plazas de carpas asignadas para esa fecha.

### 3. Algoritmo Inteligente de Distribución de Carpas
- **Inventario Fijo Real:** Establecer estrictamente el inventario en los definidos anteriormente.
- **Lógica de Asignación Automática:** Al filtrar por fecha, el sistema debe ejecutar un algoritmo eficiente que limpie, normalice el texto de los códigos y organice a los excursionistas:
  1. Agrupar prioritariamente a los participantes que tengan el mismo código de grupo (ignorando de forma automática mayúsculas, conectores redundantes como "grupo de", "los", o espacios adicionales).
  2. Distribuir a los senderistas individuales restantes segmentando por género (M/F) para garantizar la comodidad y optimización absoluta de las plazas.
- **Flexibilidad del Guía:** Permitir reajustes manuales rápidos en la interfaz mediante una funcionalidad limpia y fluida de arrastrar y soltar (Drag & Drop) participantes entre carpas.

### 4. Plan Automatizado de Catering y Snacks
- El bloque de compras debe recalcular automáticamente las cantidades exactas (ej. Cambures, Barras Energéticas, Mix de Frutos Secos) multiplicando el total de personas confirmadas en la fecha por las raciones unitarias. Rediseñar la UI de las tarjetas para que sea limpia y scannable, destacando de forma prioritaria las alertas de alergias críticas del grupo.

### 4.1. Panel de Control de Inventario y Alquileres
- **Visualización de Stock:** El panel debe mostrar una tabla resumen con el inventario total disponible vs. el comprometido por fecha.
- **Base de Datos:** Implementar la lógica relacional entre `inventory_catalog` (inventario) y `registrations` (reservas).
- **Gestión de Disponibilidad:** Habilitar un input de edición rápida para ajustar el `total_quantity` de cada ítem (ej. cuando compres más unidades de un equipo).
- **Exportación:** Incluir botones para descargar el reporte de equipos necesarios por cada fecha programada.

### 4.2. Ubicación y Unificación de los Módulos (Equipos + Catering)
1. **Frontend (Registro Público):** El módulo de "Alquileres y Provisiones" se inyecta en `index.html`. El usuario selecciona equipos, snacks y modulo opcional de portador de carpa. El sistema recalcula el total a pagar y vincula ambos pedidos al registro del usuario en Supabase.
2. **Backend (Consola /admin):** El Dashboard se divide en dos secciones unificadas por fecha:
   - **Gestión de Equipos:** Stock total vs. comprometido.
   - **Gestión de Catering:** Resumen total de unidades de snacks a comprar/preparar para la fecha seleccionada.
3. **Persistencia (Supabase):** La lógica relacional debe permitir que, al consultar una fecha, el sistema devuelva el "Roster de personas" junto con el "Consolidado de materiales y comida" (Equipos + Snacks totales requeridos).

## 5. Botón de Exportación Global (Reporte Maestro de Expedición)
- **Centralización:** Eliminar los botones de exportación por módulo. Implementar un **único botón maestro** en la parte superior del panel de administrador: **[Descargar Reporte Maestro]**.
- **Contenido del Reporte:** El archivo (PDF estructurado) debe consolidar automáticamente toda la información de la fecha seleccionada:
    1. **Roster Nominal:** Listado completo de participantes (datos, salud, contactos).
    2. **Consolidado de Catering:** Sumatoria total de snacks/comidas a preparar o comprar.
    3. **Consolidado de Inventario:** Listado de todos los equipos alquilados y quién es responsable de cada uno.
    4. **Resumen Financiero:** Total recaudado por la expedición (Tour + Extras).
- **Estética y Formato:**
    - Encabezado con branding "Expediciones Naiguatá".
    - Tablas de doble entrada para fácil lectura rápida.
    - Optimizado para impresión y lectura en dispositivos móviles.
- **Acción de Compartir:** Un único botón de [Compartir] al lado del de descarga, que utiliza la Web Share API para enviar este "Reporte Maestro" directamente a tu chat personal de respaldo o a tus colaboradores.

### 6. Automatización de Solicitud INPARQUES
- **Botón "Generar Solicitud INPARQUES":** Implementar un botón que procese la documentación legal necesaria para la expedición.
- **Acción:**
  1. **Documento del Representante:** El sistema genera un PDF con tus datos como representante de "Expediciones Naiguatá" siguiendo la estructura del documento oficial de INPARQUES (`https://www.mintur.gob.ve/documents/tramites/rtn/solicitud_rtn_juridico.pdf`).
  2. **Envío:** Abre una ventana de correo pre-configurada con el asunto: "Solicitud de Permiso para Actividad Recreativa - [Fecha] - Expediciones Naiguatá".
  3. **Destinatarios:** `dgs.parquesrecreacion@gmail.com` y `dgparques.nacionales@gmail.com`.

### 7. Auditoría Climática Automatizada (Semáforo Inteligente)
- **Monitoreo Autónomo:** El sistema consulta diariamente (cron job a las 06:00 AM) los enlaces oficiales de Meteoblue y Mountain-Forecast.
  1. Meteoblue (`https://www.meteoblue.com/en/weather/week/pico-naiguat%C3%A1_venezuela_3631611`)
  2. Mountain-Forecast (`https://www.mountain-forecast.com/peaks/Pico-Naiguata/forecasts/2765`)
- **Validación Automática:** El sistema compara los datos obtenidos contra tus criterios críticos:
    - **Criterio A: Meteoblue** Predictibilidad (>= "Very High" y < 50% de error).
    - **Criterio B: Mountain-Forecast** Lluvia Total (< 3-5 mm).
- **Semáforo Inteligente:**
    - **Estado Verde:** Si ambos criterios se cumplen, el sistema cambia el semáforo a `[🟢 RUTA CONFIRMADA]` y activa el botón de "Enviar Confirmación".
    - **Estado Rojo:** Si algún criterio falla, el sistema cambia a `[🔴 RUTA EN EVALUACIÓN]` y activa el botón de "Enviar Cancelación / Reprogramación".

### 7.1. Automatización mediante Script de Extracción
- **Tecnología:** El sistema utilizará una *Serverless Function* (Vercel) para realizar peticiones HTTP a los enlaces de Meteoblue/Mountain-Forecast.
- **Parser:** Un pequeño script procesará el texto de las páginas para extraer los valores de `precipitation` y `reliability`.
- **Costo:** 0 USD (Utiliza la cuota gratuita de ejecución de código de Vercel).
- **Frecuencia:** Se ejecuta automáticamente a las 06:00 AM cada día para las fechas con expediciones en el roster.

## 📊 Sección 8: Módulo de Control Financiero y Cajas

### 1. Modelo de Datos Relacional (Tablas en Supabase)
El Agente debe estructurar e implementar las siguientes tablas en la base de datos, conectándolas de forma relacional:
- **Tabla `financial_transactions`:**
    - `id` (UUID, Primary Key)
    - `created_at` (Timestamp)
    - `date` (Date): Fecha de la operación.
    - `type` (Text): Estrictamente "Ingreso" o "Egreso".
    - `concept` (Text): Detalle del movimiento (ej: "Ingreso: [Cliente]" o "Gasto: [Proveedor]").
    - `account` (Text): Canal financiero utilizado: `Efectivo`, `Binance`, `Zelle`, o `Banco Bs`.
    - `currency` (Text): `USD` o `VES`.
    - `amount_original` (Numeric): Monto digitado o registrado originalmente.
    - `exchange_rate` (Numeric): Tasa de cambio aplicada (BCV o personalizada si aplica).
    - `total_neto_usd` (Numeric): Columna maestra de rendimiento calculada automáticamente por el sistema bajo la siguiente lógica:
        * Si `currency` es `USD`: El sistema asigna directamente el valor de `amount_original`.
        * Si `currency` es `VES`: El sistema calcula de forma matemática `amount_original / exchange_rate`.

### 2. Sincronización e Inyección Automatizada
- **Automatización de Ingresos:** Al momento de ejecutarse un registro exitoso (ya sea por pasarela automática aprobada o por aprobación manual del guía en el Roster), el sistema debe inyectar de forma paralela y automática una fila en `financial_transactions` con el tipo `"Ingreso"`, el canal de pago correspondiente y el monto total calculado (Tour + Alquileres + Catering).
- **Control de Egresos (Estructura Multimoneda Nativa):** El sistema debe implementar un formulario dedicado en el Dashboard para asentar de forma manual cada salida de dinero. Para mitigar descuadres por tasa de cambio, la inyección en la tabla `financial_transactions` debe seguir las siguientes reglas operativas:
  - **Campos Obligatorios de Captura (UI):**
    * **Categoría del Gasto:** Menú desplegable con opciones fijas (Catering/Alimentos, Guías Auxiliares, Logística/Transporte, Imprevistos).
    * **Descripción:** Campo de texto libre (ej: "Compra de hielo en San Isidro" o "Pago guía de respaldo").
    * **Cuenta de Origen:** Selección del canal físico de donde sale el dinero (`Efectivo`, `Binance`, `Zelle`, o `Banco Bs`).
    * **Moneda de Pago:** El sistema debe inferir e inyectar la moneda de forma interna aplicando la siguiente condicional lógica en tiempo real:
      - **Si Cuenta de Origen es `Banco Bs`:** La moneda se establece automáticamente como `VES` y la interfaz bloquea/muestra visualmente que el gasto es en Bolívares.
      - **Si Cuenta de Origen es `Efectivo`, `Binance` o `Zelle`:** La moneda se establece automáticamente como `USD` y la interfaz refleja que el gasto es en Dólares.
    * **Monto Original:** Caja numérica para colocar la cantidad pagada en la moneda asignada automáticamente.
  - **Lógica de Conversión y Automatización Financiera:**
    * **Si el gasto se registra en Bolívares (VES)(Entrada Manual Condicional):** Campo numérico habilitado únicamente cuando la cuenta es `Banco Bs`. Permite al guía digitar manualmente la tasa exacta del BCV a la que se ejecutó el gasto (contemplando pagos realizados en días anteriores) e inyecta la fila calculando de forma matemática: `amount_original` (en VES), `exchange_rate` (tasa BCV) y el valor neto convertido a dólares en un campo interno de la base de datos (`total_neto_usd = amount_original / exchange_rate`).
    * **Si el gasto se registra en Dólares (USD):** El sistema asume que el egreso es directo. Guarda `amount_original` (en USD) y establece el `total_neto_usd` exactamente con el mismo valor, dejando la tasa referencial asentada.
  - **Impacto en el Balance:** Al presionar **[Registrar Egreso]**, la transacción resta de forma inmediata el saldo disponible de la "Cuenta de Origen" seleccionada y se vincula al `id` con una selección manual de registro de la fecha del tour para deducir la rentabilidad de esa salida.

### 3. Vista UI del Balance de Cajas (Consolidado de Cuentas)
En la pestaña financiera del panel `/admin`, el sistema debe renderizar un componente de control de caja procesado en tiempo real:
- **Matriz de Saldos Activos:** Tarjetas dinámicas que listen el saldo neto actual (Fórmula: $\text{Entradas} - \text{Salidas}$) segmentado de forma estricta por cada una de tus 4 cajas principales:
    - 💵 **Caja Efectivo (USD)**
    - 🔶 **Caja Binance (USDT/USD)**
    - 💜 **Caja Zelle (USD)**
    - 🇻🇪 **Caja Banco Bs (VES)**
- **Filtro Maestro unificado:** Al cambiar la tarjeta interactiva de fecha en la cabecera del panel administrativo (Sección 6), el balance de cajas, los ingresos y los egresos listados deben recalcularse de manera reactiva únicamente con los movimientos asociados a esa salida de montaña.

### 4. Módulo de Rendimiento y Análisis Financiero Dinámico (Métricas sobre Base USD)
- **Lógica de Procesamiento Continuo:** Este componente calcula el rendimiento financiero del negocio en tiempo real. En lugar de procesar celdas estáticas pre-calculadas, el sistema ejecuta consultas agregadas (`SUM`, `COUNT`) directamente sobre la tabla `financial_transactions` basándose en la columna unificada `total_neto_usd`, cruzándola de forma relacional con la tabla de salidas cuando se requiera segmentar por evento.

- **Estructura del Filtro Maestro de Rendimiento (UI):**
  La interfaz debe presentar un panel superior de control con selectores reactivos para actualizar los gráficos y KPIs al instante:
  * **Filtro por Salida Específica:** Menú desplegable que lista todas las expediciones ejecutadas (ej: *"Tour Naiguatá - 14/03/2026"*). Al seleccionarlo, el sistema filtra las transacciones amarradas al `id_fecha`.
  * **Filtro por Rango de Días (Personalizado):** Selector de fecha doble (Fecha Inicio y Fecha Fin) para evaluar periodos arbitrarios (ej: los últimos 7 días, últimos 15 días o temporadas específicas).
  * **Filtro Acumulado (Total Histórico):** Botón de acceso rápido para remover límites de tiempo y evaluar el rendimiento global desde el día uno.
  * **Filtro Mensual Tradicional:** Selector de mes/año continuo para mantener la compatibilidad con el esquema analítico clásico.

- **Métricas Clave a Renderizar (Tarjetas KPI en UI):**
  Al aplicar cualquiera de los filtros anteriores, el sistema debe calcular y mostrar de forma obligatoria las siguientes variables financieras en dólares:
  1. **Ingresos Brutos Totales (USD):** Sumatoria de todos los registros del periodo donde `type` sea estrictamente "Ingreso".
  2. **Egresos Totales (USD):** Sumatoria de todos los registros del periodo donde `type` sea estrictamente "Egreso".
  3. **Rendimiento / Beneficio Neto (USD):** Operación matemática lineal en el frontend: `Ingresos Brutos - Egresos Totales`. Si el resultado es negativo, el KPI se renderiza en rojo; si es positivo, en verde.
  4. **Margen de Ganancia (%):** Cálculo porcentual de rentabilidad: `(Beneficio Neto / Ingresos Brutos) * 100`.
  5. **Volumen de Excursionistas:** Conteo único de clientes con estatus de pago aprobado integrados en las fechas que caigan dentro del rango seleccionado.

- **Visualización Gráfica Reactiva (Set de Gráficos Críticos):**
  Para transformar los datos crudos en decisiones de negocio, el frontend debe renderizar de manera reactiva los siguientes tres gráficos clave según el filtro temporal o por salida seleccionado:

  1. **Gráfico de Barras Agrupadas: Comparativa de Flujo de Caja (Ingresos vs. Egresos)**
     * *Eje X:* Tiempo (Meses/Semanas) o Nombre del Tour (si el filtro es por salidas).
     * *Eje Y:* Monto acumulado en USD.
     * *Lógica Visual:* Dos barras por periodo (Verde para Ingresos Brutos, Roja para Egresos Totales). Permite identificar instantáneamente si alguna salida específica operó a pérdida o si los costos logísticos de una temporada se dispararon.
  
  2. **Gráfico de Línea de Tendencia: Margen de Beneficio Neto y Retorno**
     * *Eje X:* Línea de tiempo continua.
     * *Eje Y:* Porcentaje de Margen Neto o Dólares Líquidos.
     * *Lógica Visual:* Una línea que traza la ganancia real limpia (Ingresos - Egresos). Sirve para mapear la salud financiera del negocio a mediano plazo y evaluar si los aumentos de precios de los tours están mejorando la rentabilidad real.

  3. **Gráfico de Torta (Pie) o Anillo: Distribución de Costos Operativos**
     * *Métricas:* Segmentación de la columna `Categoría del Gasto` (Catering, Guías Auxiliares, Logística/Transporte, Imprevistos).
     * *Lógica Visual:* Muestra el porcentaje del presupuesto total que consume cada rubro. Es fundamental para auditorías rápidas: si el catering (barras, frutas) supera el porcentaje estimado por participante, alerta para renegociar con proveedores o ajustar las porciones.

  4. **Gráfico de Barras Horizontales: Métricas de Canales de Recaudación (Cuentas)**
     * *Métricas:* Balance acumulado por tipo de cuenta (`Efectivo`, `Binance`, `Zelle`, `Banco Bs`).
     * *Lógica Visual:* Permite visualizar de forma inmediata dónde está físicamente atrapado el dinero del negocio para gestionar la liquidez (ej: saber cuánto capital tienes congelado en Bolívares o cuánto tienes disponible en efectivo inmediato para gastos en ruta).

### 4.1. Sub-Módulo de Optimización de Liquidez y Cobertura Cambiaria (Mitigación Inflacionaria)
- **Lógica de Protección de Capital:** El sistema debe calcular de forma automática el "Excedente de Riesgo en VES" para cada tour. Esto evita que el guía mantenga saldos ociosos en Bolívares en la cuenta bancaria, agilizando la conversión a divisas estables.

- **Estructura del Asistente de Cobertura (UI / Dashboard):**
  Al seleccionar una salida específica, el panel financiero mostrará una tarjeta de acción prioritaria con las siguientes métricas en tiempo real:
  * **Recaudación en Bs. Actual:** Sumatoria de ingresos en la cuenta `Banco Bs` para ese tour.
  * **Fondo de Gastos Estimados en Bs. (Algoritmo Anti-Inflación):** Es la sumatoria de los egresos proyectados en moneda nacional para la fecha seleccionada. Para evitar que las estimaciones queden obsoletas por la devaluación, el sistema calculará esta métrica aplicando tres metodologías de indexación nativas:
    1. **Egresos Anclados a USD (Tasa de Salida):** Los costos que varían con el mercado (ej: transporte privado contratado, guías auxiliares) se configuran en el backend en base a un valor base en dólares. El sistema calcula su estimado multiplicando: `Valor_en_USD * Tasa_BCV_Digitada_por_el_Guía`.
    2. **Egresos por Consumo Indexado (Catering):** Los gastos de alimentos se estiman multiplicando de forma matemática los gramos de insumos requeridos para los pasajeros del tour por el costo por gramo de la materia prima, el cual el guía puede actualizar con un clic en una mini-tabla de precios base sin tocar el código.
    3. **Egresos por Tasas Oficiales (Permisos de Parques/Inparques):** Para trámites que se rigen por unidades oficiales del Estado (que cambian por decreto), el sistema permite guardar un factor multiplicador fijo en la base de datos (ej: "Monto = 10 Unidades de Cuenta"). El guía solo actualiza el valor de esa Unidad de Cuenta una vez, y todo el sistema se recalcula en segundos.
  * **Sugerencia de Conversión Inmediata (Métrica Maestra):** Operación matemática calculada por el sistema: `Recaudación en Bs. - Fondo de Gastos en Bs.`. El resultado se muestra resaltado con una alerta: *"Monto sugerido para cambiar a USD/USDT: X Bolívares"*.

- **Formulario de Registro de Permuta / Cambio de Divisas:**
  Para mantener las cuentas cuadradas al centavo, el sistema debe permitir registrar la acción de cambio a través de un formulario de transferencia interna:
  * **Acción:** **[Registrar Cambio a Divisas]** -> Al ejecutar esta acción, el sistema genera de forma automática dos transacciones espejo en `financial_transactions`:
    1. Un **Egreso** en la cuenta `Banco Bs` por el monto en Bolívares que se va a cambiar.
    2. Un **Ingreso** en la cuenta de destino elegida (`Binance Pay` o `Efectivo Físico`) con el monto equivalente en Dólares, solicitando al guía digitar la tasa real a la que logró ejecutar el cambio en la calle o en la plataforma P2P.

### 5. Módulo Auxiliar: Checklist Pre-Viaje Digital (Logística por Fecha y Acciones Automatizadas)
- **Vinculación al Filtro Maestro:** Este módulo no utiliza almacenamiento local genérico ni botones de reseteo global. Al seleccionar una fecha específica en el Filtro Maestro del panel (Sección 6), el sistema carga el estado de los checkboxes guardados en la tabla relacional de Supabase (`checklist_salidas`) vinculada al `id_fecha`. Cada fecha mantiene su histórico independiente de preparativos.
- **Estructura de la Matriz Interactiva:** El componente debe renderizar las tareas organizadas por bloques jerárquicos. Cada fila contendrá el título de la tarea, la casilla de verificación y un botón dinámico para ejecutar la acción automatizada con un clic:

#### **BLOQUE 1: Gestión de Reserva (Antes de empezar)**
- **Tarea:** Confirmar número exacto de personas (para calcular catering, carpas y alquiler de equipo)
  - *Acción:* **[Ver Totales]** -> Ejecuta una consulta rápida en el roster para contar los participantes confirmados de la fecha y muestra el calculo del catering, carpas y alquiler de equipo.

- **Tarea:** Crear grupo de WhatsApp exclusivo del tour y vincularlo al sistema
  - *Acción:* **[Crear y Vincular Grupo]** -> 
    1. Abre una pestaña en WhatsApp Web para la creación manual del grupo e inyecta en el portapapeles el texto de bienvenida:
       > "¡Hola! 🏔️ Estamos preparando todo para nuestra expedición al Pico Naiguatá. He creado este grupo exclusivo para los participantes de este tour. Por aquí estaré compartiendo las actualizaciones logísticas, el reporte del clima y cualquier información importante antes de subir. Por favor, mantengamos el grupo solo para temas relacionados al viaje. ¡Nos vemos pronto en la montaña!"
    2. **Campo Dinámico en UI:** Habilita un input de texto temporal en la fila de la tarea: `[ Pegar Link de Invitación del Grupo ]`. Al guardar el link (ej: `chat.whatsapp.com/AbCdEf12345`), el sistema extrae el ID único del grupo y actualiza el campo `whatsapp_group_id` en Supabase para esta fecha específica.
- **Tarea:** Enviar PDF de logística y recomendaciones al grupo de Whatsapp
  - *Acción:* **[Compartir PDF]** -> Genera un enlace rápido al grupo de Whatsapp con el texto pre-armado y el link del Drive:
    > "¡Hola equipo! 🏔️ Ya estamos a pocos días de nuestra expedición al Pico Naiguatá. Para que todos estemos alineados con la logística, seguridad y los detalles técnicos del ascenso, les comparto el documento oficial del tour. Por favor, tómense un momento para leerlo con calma. Allí encontrarán: ✅ Itinerario detallado. ✅ Lista final de equipo personal obligatorio. ✅ Consejos de hidratación y alimentación. 📄 Puedes consultar el PDF aquí: https://drive.google.com/file/d/1Y-H51Vgvbn6iH-Ao0rzwrs_WLf9BxZP6/view?usp=sharing Cualquier duda técnica que tengan después de leerlo, me escriben por aquí. ¡Nos vemos en la cumbre! 🧗‍♂️✨"

#### **BLOQUE 2: Producción y Logística (Catering, Compras e Inventario Automatizado)**
- **Lógica de Vinculación Dinámica Nativa:** Este bloque procesa los datos en tiempo real desde cero. Al cargar la fecha seleccionada en el Filtro Maestro (Sección 6), el sistema debe realizar un barrido automático en las tablas de Supabase para contar el número total de excursionistas confirmados ($N$) y el total de equipamiento/carpas solicitadas para esa salida específica. Con estos valores, ejecuta los siguientes algoritmos matemáticos:

- **Estructura de la Matriz Interactiva de Producción:**
| Tarea Crítica | Algoritmo y Lógica de Cálculo Interno | Acción con Un Clic (Automatización) |
| :--- | :--- | :--- |
| **🛒 Compra de Materia Prima e Insumos** | Multiplica el total de clientes confirmados ($N$) por las siguientes métricas de consumo base para calcular el volumen total de compra: <br>• **Avena:** $N \times 40\text{g}$<br>• **Nueces:** $N \times 15\text{g}$<br>• **Almendras:** $N \times 15\text{g}$<br>• **Papelón:** $N \times 25\text{g}$<br>• **Mix Frutos Secos:** $N \times 50\text{g}$<br>• **Bananas (Cambur):** $N \times 1\text{ ud}$. | **[Generar Lista de Compras]**: Despliega un modal flotante que muestra el total acumulado en kilogramos y unidades según el tamaño real del grupo, y copia automáticamente dicho resumen estructurado en el portapapeles. |
| **🍳 Cocina y Elaboración de Barras** | Provee al guía las instrucciones de manufactura estandarizadas para el catering artesanal. | **[Ver Ficha Técnica]**: Muestra un modal con el procedimiento técnico: *"Receta Base: Avena + Nueces + Almendras + Papelón. Procedimiento: Fundir papelón -> Mezclar con frutos secos -> Compactar con fuerza en bandeja -> Cortar en frío tras solidificación."* |
| **📦 Empacado y Kits de Marcha** | Establece el estándar físico de empaque individual para el control de calidad del guía. | **[Ver Guía de Empaque]**: Despliega una alerta de UX: *"Empacar por participante en bolsas higiénicas individuales selladas: 1 kit de 2 barras energéticas caseras + 1 bolsa de 50g de mix de frutos secos + 1 banana fresca."* |
| **⛺ Auditoría de Carpas y Alojamiento** | El sistema procesa de forma nativa la columna `Preferencia de Alojamiento` de los usuarios asignados a la fecha y totaliza de manera exacta cuántas estructuras físicas de cada tipo deben trasladarse al terreno (ej: total de carpas de 2 personas y total de carpas de 3 personas). | **[Verificar Distribución]**: Genera una alerta visual que calcula la carga requerida: *"Se requiere extraer del almacén: X carpas de 2p y Y carpas de 3p"*, comparándolo automáticamente con el stock máximo global en Supabase para emitir alertas si faltan plazas. |
| **🛠️ Conteo de Equipamiento y Alquileres** | Agrupa y totaliza de forma matemática la cantidad exacta de sleeping bags, aislantes térmicos y linternas frontales que fueron rentados a través del formulario de inscripción para este viaje. | **[Ver Matriz de Carga]**: Despliega una lista de verificación de almacén en tiempo real: *"Cargar en la mochila logística: X Sacos de dormir, Y Aislantes térmicos, Z Linternas frontales, 2 Linternas de carpa globales y cuerda de seguridad extra."* |
| **🧼 Control de Calidad y Mantenimiento** | Control del estado fitosanitario y operativo de las lonas previo y posterior al ascenso. | **[Confirmar Limpieza]**: Ejecuta una mutación en la base de datos que marca el equipamiento asignado a esta salida con el estatus "Listo, Seco y Verificado" para garantizar la prevención de humedad o fallas en cierres. |

#### **BLOQUE 3: Seguridad y Terreno (Pre-Viaje)**
- **Tarea:** Confirmación de Alerta Meteorológica y Agenda Operativa
  - *Lógica de Automatización:* En lugar de botones externos, el componente lee el estado del monitoreo climático automatizado para la fecha seleccionada y renderiza una tarjeta con un indicador visual (Verde: Salida Segura / Amarillo: Monitoreo por Lluvias / Rojo: Alerta de Suspensión).
  - *Acción en Interfaz:* Casilla de verificación manual: `[ ] Confirmar revisión del reporte climático del sistema y alineación con la agenda`.
  - *Agenda Visual de Respaldo:* Cuadro de texto informativo para el control del guía:
    * 🗓️ **5 días antes:** Verificar que el sistema ya haya extraído el primer pronóstico automatizado.
    * 🗓️ **3 días antes:** Monitorear que el aviso preliminar se haya enviado con éxito al grupo de WhatsApp.
    * 🗓️ **2 días antes:** Toma de decisión final basada en la regla del sistema: si hay más del 50% de probabilidad de lluvia fuerte, validar el protocolo de postergación activa.
- **Tarea:** Revisar Botiquín
  - *Acción:* **[Ficha de Insumos]** -> Muestra la lista de chequeo obligatoria: *"Compeed/parches para ampollas, Gasas estériles, Esparadrapo de tela (Leukotape), Antiséptico spray, Suero fisiológico (ampollas 10ml), Ibuprofeno/Paracetamol, Antihistamínico, Antiácido, Antidiarreico, Pinzas de cejas, Tijeras pequeñas y Manta térmica de emergencia OBLIGATORIA"*.
- **Tarea:** Cargar Powerbanks y linternas
  - *Acción:* **[Marcar Cargado]** -> Guarda la confirmación de sistemas eléctricos listos.
- **Tarea:** Verificación de stock de agua (recordatorio a clientes)
  - *Acción:* **[Enviar Recordatorio Agua]** -> Dispara el mensaje al grupo: *"¡Hola equipo! 🏔️ Recuerden traer mínimo 3L de agua. Tip: Eviten botellas plásticas delgadas, usen envases resistentes."*
- **Tarea:** Briefing Seguridad por Lluvias
  - *Acción:* **[Enviar Protocolo Lluvia]** -> Dispara al grupo el texto de contingencia: *"Prioridad: Tu Seguridad 🌧️ Ante la temporada de lluvias, nuestra prioridad absoluta es garantizar tu bienestar. En caso de que las condiciones meteorológicas nos obliguen a suspender la actividad, no te preocupes: tendrás prioridad absoluta para reagendar tu experiencia en nuestra próxima fecha disponible."*

#### **BLOQUE 4: Comunicación Final (Día previo)**
- **Tarea:** Recordar lista de vestimenta y equipo (bolsas de dormir, luces)
  - *Acción:* **[Enviar Recordatorio Ropa]** -> Envía el mensaje estructurado del sistema de capas: *"¡Hola equipo! 🏔️ Seguimos con los preparativos... Les recuerdo el equipo personal indispensable: 1. Pernocta (Sleeping bag adecuado y Aislante térmico/Esterilla). 2. Iluminación (Linterna frontal). 3. Vestimenta (Capa base transpirable, capa de abrigo fleece/plumas, capa exterior cortavientos, medias de repuesto y calzado con buen agarre)..."*
- **Tarea:** Confirmación final meteorológica
  - *Acción:* **[Validar Clima]** -> Guarda la verificación final en base a la regla: *"Si Meteoblue indica very high predictability y less than 50% + Mountain-Forecast muestra menos de 3-5 mm de lluvia total = salida confirmada"*.
- **Tarea:** Confirmación final de asistencia (todos los participantes confirmados)
  - *Acción:* **[Pasar Lista Final]** -> Envía al grupo: *"¡Hola, equipo! 🏔️ Ya estamos a nada de nuestra aventura. Por favor, confírmenme por aquí con un 'Confirmado' quienes ya tienen todo su equipo listo (saco de dormir, linterna, hidratación) y están listos para encontrarnos mañana en La Julia a las 07:30 AM..."*
- **Tarea:** Enviar ubicación exacta del punto de encuentro (La Julia)
  - *Acción:* **[Enviar Ubicación]** -> Envía al grupo los datos de geolocalización exactos: *"¡Hola equipo! 🏔️ Les comparto la ubicación exacta de nuestro punto de encuentro para el inicio de la expedición al Pico Naiguatá: 📍 Lugar: Sector La Julia (Entrada al Parque Nacional El Ávila). ⏰ Hora de encuentro: 07:30 AM (puntualidad, por favor). Link de Google Maps: https://maps.app.goo.gl/7rLDrLBeQCvrkrsy6"*
- **Tarea:** Documentos y seguridad
  - *Acción:* **[Descargar Roster Offline]** -> Exporta un archivo ligero de texto plano o PDF con los nombres, teléfonos y contactos de emergencia de los participantes anotados para esa salida, junto con las alertas de salud críticas (Flags Rojos).

### Sección 9. Panel de Ajustes del Sistema y Variables Maestras (Base USD)
- **Lógica de Centralización:** Esta pantalla es de acceso exclusivo para el administrador. Centraliza los valores y costos base del negocio para evitar tener que modificar el código fuente cuando cambien los precios en el mercado venezolano. Todos los módulos operativos y financieros consumen los datos de esta sección.

- **Variables Maestras de Costos de Suministros (Editable en UI):**
  La base de datos mantendrá los siguientes valores de referencia para realizar las proyecciones automáticas de gastos y fondos de contingencia:

| Insumo / Suministro | Unidad Comercial | Costo Comercial | Costo Unitario de Cálculo (Internal Backend) |
| :--- | :--- | :--- | :--- |
| **Avena** | Kilogramo (1000g) | $4.00 | $0.004 por gramo |
| **Nueces** | Kilogramo (1000g) | $21.00 | $0.021 por gramo |
| **Almendras** | Kilogramo (1000g) | $21.00 | $0.021 por gramo |
| **Papelón** | Empaque (500g) | $1.80 | $0.0036 por gramo |
| **Mix Frutos Secos** | Kilogramo (1000g) | $24.00 | $0.024 por gramo |
| **Banana (Cambur)** | Unidad Promedio | $2.00 (Kilo de ~6 uds) | $0.35 por unidad |
| **Bolsa Plástica** | Unidad | $0.15 | $0.15 por unidad |
| **Dulce de Guayaba** | Paquete (20 uds) | $17.00 | $0.85 por unidad |

- **Inyección y Fórmulas Lógicas del Backend:**
  Utilizando los valores de esta tabla, el sistema calcula de manera automática los costos de producción sin intervención del usuario:
  1. **Costo Fijo de Catering por Persona:** El sistema procesa la receta base (40g Avena, 15g Nueces, 15g Almendras, 25g Papelón $\times$ 2 barras) + los complementos de marcha (50g Mix Frutos Secos, 1 Banana, 1 Bolsa) arrojando un costo automatizado de **$3.51 por participante**.
  2. **Interconexión con Módulos:** 
     - **En Bloque 2 (Producción):** Multiplica el número de pasajeros por los gramos base para mostrar la lista de compras física.
     - **En Bloque 4.1 (Optimización de Liquidez):** Multiplica los pasajeros confirmados por $3.51 para generar el *Fondo de Gastos Estimados en Bs.* (aplicando la tasa BCV manual que digites).
  3. **Cálculo del Costo Real de Catering (Margen Neto):** Al procesar la rentabilidad de un tour, el sistema calculará el costo variable de catering sumando de forma dinámica el costo base de producción ($3.51 × número de participantes) + el costo de adquisición de cada snack o alimento extra que los clientes hayan pagado aparte en el formulario público. Esto permite al guía conocer la ganancia neta real deduciendo el costo exacto de los insumos extra vendidos.
---

## 🌐 INFRAESTRUCTURA CLOUD Y CONFIGURACIÓN DE BASE DE DATOS

El sistema debe operar de forma 100% autónoma en el frontend, conectándose directamente a los servicios en la nube para garantizar que el Administrador pueda gestionar las expediciones en tiempo real tanto desde su computadora como desde su teléfono celular, manteniendo una sincronización perfecta entre dispositivos.

### 🔑 CREDENCIALES DEL PROYECTO (SUPABASE & VERCEL)
- **URL del Sitio Web (Producción en Vercel):** https://naiguata-expeditions.vercel.app/
- **URL de la Base de Datos (REST API):** https://cnoeumcshfrfrzyvbxcn.supabase.co
- **Project ID:** cnoeumcshfrfrzyvbxcn
- **Project Name:** diegomorono's Project
- **Supabase Anon Key (Publishable Key):** sb_publishable_qF2ETcffYEwh0nz27uV1rQ_JSxp7mA6

### ⛓️ Módulo de Gestión de Concurrencia y Transacciones Atómicas (Control de Cupos)
Para garantizar un rendimiento libre de fallos cuando múltiples usuarios intentan registrarse simultáneamente en una misma fecha, el sistema no debe depender de validaciones simples en el cliente.
- **Lógica de Mutación Segura:** Antes de confirmar cualquier inserción en la tabla `registrations`, el backend de Supabase debe ejecutar un procedimiento almacenado (función RPC nativa) que verifique la disponibilidad real de cupos bloqueando temporalmente la fila de la fecha correspondiente. Si el cupo se agota en el milisegundo previo a que el cliente presione el botón de envío, el sistema cancelará la operación de forma segura (Rollback), devolverá un código de estado controlado y mostrará una alerta elegante informando al usuario que los cupos se acaban de agotar, evitando la sobreventa de la expedición.

### 🗄️ ARQUITECTURA DE DATOS Y FLUJO MULTI-DISPOSITIVO
- **Registro Autónomo del Cliente:** El formulario de la landing page pública debe interceptar los datos de inscripción e inyectarlos directamente en la tabla de Supabase mediante solicitudes HTTP utilizando la URL del proyecto y la clave pública (Anon Key). No se requiere backend intermedio manual.
- **Consola de Operaciones en Tiempo Real:** La interfaz del Administrador debe realizar consultas dinámicas automáticas al servidor en la nube cada vez que se cargue la página, garantizando que el Roster de senderistas, los cálculos de snacks y el algoritmo de asignación de carpas reflejen los mismos datos en la computadora y en el celular.
- **Persistencia Local de Respaldo:** Implementar un sistema híbrido que almacene temporalmente los estados de la interfaz en el LocalStorage del dispositivo para optimizar la velocidad de carga y mitigar la pérdida de datos en zonas de baja cobertura de montaña, sincronizándose con la nube tan pronto se recupere la conexión a internet.
- **Sincronización Offline-First (Cola de Eventos):** Implementar una lógica de Queue en el navegador mediante un Service Worker. Si el usuario registra una reserva o el guía modifica el roster sin conexión, el sistema debe persistir los datos en IndexedDB y encolar la transacción. La sincronización automática con Supabase debe dispararse en segundo plano tan pronto el dispositivo detecte una conexión a internet activa, asegurando que no se pierda ninguna transacción realizada en montaña.

### 🛣️ ENRUTAMIENTO Y SEGURIDAD DE ACCESO (LOGIN EXPLICITO)
- **Subdirectorio de Administración:** Configurar el despliegue para gestionar rutas internas en el mismo dominio de Vercel. La landing page pública para clientes residirá en la raíz del proyecto, mientras que la Consola Privada del Guía se alojará de forma exclusiva en la ruta hija: `https://naiguata-expeditions.vercel.app/admin`
- **Barrera de Autenticación Hardcoded:** El acceso al subdirectorio `/admin` debe ser bloqueado por un componente UI de Login antes de cargar los datos de la consola.
  No permitir saltarse este paso ni mediante la inspección del almacenamiento local de sesión si las credenciales no han sido validadas primero.

### ✉️ INTEGRACIONES NATIVAS SIN APIS CORPORATIVAS
- **Flujo de WhatsApp:** La comunicación con los senderistas para la entrega de pases digitales o alertas climáticas debe ejecutarse mediante la API pública de enlaces dinámicos (https://wa.me/). Las funciones de JavaScript deben procesar y formatear los textos del Roster de manera interna en una cadena codificada para URL, abriendo la aplicación nativa de WhatsApp en el dispositivo del guía con el mensaje pre-redactado sin requerir tokens de Meta ni plataformas de pago.
- **Tramitación ante INPARQUES:**
- **Botón "Generar y Enviar Solicitud":** Al presionar, el sistema ejecuta dos acciones sincronizadas:
    1. **Descarga Automática:** Genera el PDF con el formato oficial de la solicitud y lo descarga automáticamente al dispositivo del usuario.
    2. **Disparo de Correo (Mailto):** Abre el cliente de correo predeterminado del sistema con la estructura pre-configurada:
       - **Destinatarios:** `dgs.parquesrecreacion@gmail.com`, `dgparques.nacionales@gmail.com`
       - **Asunto:** "Solicitud de Permiso para Actividad Recreativa - [Fecha Seleccionada] - Expediciones Naiguatá"
       - **Cuerpo del mensaje:** "Adjunto envío la documentación legal requerida para la expedición programada. Saludos, Diego Morono."
    3. **Interfaz de usuario:** Inmediatamente al abrir el correo, el sistema debe mostrar una alerta clara sobre el archivo recién descargado: *"El archivo se ha descargado. Por favor, selecciona 'Adjuntar' y elige el primer archivo de tu carpeta de descargas para enviarlo."*

## Tareas del Agente
Valida y modifica de forma autónoma los archivos `Website/index.html`, `Website/styles.css` y `Website/app.js` para cumplir estrictamente con toda la infraestructura gratis y las mejoras de UI/UX solicitadas en este documento. No consumas tokens en explicaciones extensas; prioriza la escritura de código limpio y funcional.