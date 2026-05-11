# Política de Privacidad de Parkit

**Última actualización:** 11 de mayo de 2026
**Vigencia:** A partir de la fecha indicada arriba.

Esta Política de Privacidad describe cómo **Parkit** (en adelante, "Parkit", "nosotros" o "la Plataforma") recolecta, utiliza, almacena, comparte y protege la información personal de las personas usuarias de la aplicación móvil Parkit, del sitio web goparkit.com.ar y de los servicios asociados (en adelante, los "Servicios").

Al descargar, instalar, crear una cuenta o utilizar los Servicios, usted declara haber leído, comprendido y aceptado los términos de esta Política. Si no está de acuerdo, le solicitamos que no utilice los Servicios.

Parkit cumple con la **Ley N° 25.326 de Protección de los Datos Personales** de la República Argentina, su Decreto Reglamentario 1558/2001, las disposiciones emitidas por la **Agencia de Acceso a la Información Pública (AAIP)**, y, en lo que resulta aplicable, con estándares internacionales como el Reglamento General de Protección de Datos (GDPR) y la California Consumer Privacy Act (CCPA).

---

## 1. Responsable del tratamiento

- **Razón social:** Parkit
- **Domicilio legal:** Buenos Aires, Argentina
- **Correo electrónico de contacto:** contacto@goparkit.com.ar
- **Sitio web:** https://goparkit.com.ar

Para cualquier consulta relacionada con esta Política de Privacidad o con el tratamiento de sus datos personales, puede escribirnos al correo indicado.

---

## 2. Información que recolectamos

### 2.1. Información que usted nos provee

- **Datos de registro:** nombre y apellido, dirección de correo electrónico, número de teléfono, contraseña (almacenada en forma cifrada), foto de perfil (opcional).
- **Datos de vehículo:** marca, modelo, año, color, patente/dominio y dimensiones del vehículo (largo, ancho, alto), cuando usted decide cargarlos para usar funcionalidades vinculadas al estacionamiento.
- **Datos para publicar estacionamientos** (solo para usuarios anfitriones o comerciales): dirección, fotografías del espacio, capacidad, tarifas, horarios de disponibilidad, datos fiscales (CUIT, condición frente al IVA) y datos bancarios o de MercadoPago para recibir cobros.
- **Reseñas, calificaciones, reportes y mensajes** que usted publica en la Plataforma.
- **Comunicaciones** que mantiene con nuestro equipo de soporte.

### 2.2. Información que recolectamos automáticamente

- **Ubicación geográfica:**
  - **Ubicación precisa (GPS)** en primer plano, para mostrarle estacionamientos cercanos, calcular rutas y brindar navegación turn-by-turn.
  - **Ubicación en segundo plano** *(opcional, solo con su consentimiento expreso)* para alertarle de lugares libres cercanos, detectar automáticamente que estacionó, recordar dónde dejó el vehículo y para funcionalidades de navegación que continúan con la pantalla apagada.
  - Puede revocar este permiso en cualquier momento desde la configuración de su dispositivo. Si lo hace, ciertas funciones quedarán limitadas o no estarán disponibles.
- **Datos de uso:** pantallas visitadas, acciones realizadas, búsquedas, rutas calculadas, marca de tiempo de eventos, errores de la aplicación.
- **Datos del dispositivo:** modelo, sistema operativo y versión, identificadores de dispositivo, idioma, zona horaria, tipo de conexión.
- **Datos de orientación y sensores:** brújula, acelerómetro y giroscopio del dispositivo, utilizados para la navegación y la detección de estacionamiento.
- **Cámara y fotos:** únicamente cuando usted lo autoriza, para tomar fotografías de espacios de estacionamiento (en el caso de anfitriones) o para funciones de detección visual de lugares libres. **Parkit no accede a su galería de forma silenciosa.**

### 2.3. Información de terceros

- **Inicio de sesión con Google o Apple:** si elige autenticarse mediante Google Sign-In o Apple Sign-In, recibimos los datos básicos que esos proveedores nos comparten (nombre, correo electrónico y, en algunos casos, foto de perfil), según los permisos que usted otorgue.
- **MercadoPago:** cuando realiza o recibe pagos, MercadoPago nos comparte el estado de las transacciones, identificadores de operación y el monto. **Parkit nunca recibe ni almacena los datos completos de su tarjeta de crédito o débito.** Esos datos son procesados directamente por MercadoPago bajo sus propios estándares de seguridad (PCI-DSS).

---

## 3. Finalidades del tratamiento

Utilizamos su información para las siguientes finalidades:

| Finalidad | Datos involucrados | Base legal |
|---|---|---|
| Crear y administrar su cuenta | Datos de registro, autenticación | Ejecución del contrato |
| Mostrarle estacionamientos cercanos y calcular rutas | Ubicación, datos de vehículo | Ejecución del contrato |
| Permitirle reservar, pagar y recibir cobros por estacionamientos | Datos de pago, reservas | Ejecución del contrato |
| Mostrar lugares libres reportados por la comunidad (SpotFree) | Ubicación, reportes | Interés legítimo / consentimiento |
| Mejorar la app y prevenir fraude | Datos de uso, dispositivo | Interés legítimo |
| Enviar notificaciones operativas (reservas, pagos, recordatorios) | Email, push tokens | Ejecución del contrato |
| Enviar comunicaciones promocionales | Email, datos de perfil | Consentimiento (revocable) |
| Cumplir con obligaciones legales, fiscales y regulatorias | Datos identificatorios, fiscales | Obligación legal |
| Resolver disputas, atender reclamos y proteger derechos | Todos los anteriores | Interés legítimo |

---

## 4. Con quién compartimos su información

No vendemos sus datos personales. Compartimos información únicamente con los siguientes destinatarios, en la medida estrictamente necesaria:

### 4.1. Proveedores de servicios (encargados del tratamiento)

| Proveedor | Servicio | Ubicación principal de los datos |
|---|---|---|
| **Supabase** | Base de datos, autenticación, almacenamiento de archivos, edge functions | Servidores en EE.UU. y/o UE |
| **Google LLC** | Google Maps, Places, Directions, Geocoding, Sign-In, notificaciones push (FCM) | EE.UU. |
| **Apple Inc.** | Sign-In con Apple, notificaciones push (APNs) | EE.UU. |
| **MercadoPago (Mercado Libre S.R.L.)** | Procesamiento de pagos | Argentina / Brasil |
| **Upstash** | Caché Redis | EE.UU. / UE |

Todos los proveedores están obligados contractualmente a tratar los datos exclusivamente para prestar los Servicios contratados y bajo estándares razonables de seguridad.

### 4.2. Otros usuarios de la Plataforma

- Cuando publica un estacionamiento o lo reserva, ciertos datos (nombre de pila, foto de perfil, calificación, vehículo aproximado) pueden ser visibles para la contraparte de la transacción.
- Las reseñas y comentarios públicos son visibles para todos los usuarios.

### 4.3. Autoridades y terceros legítimos

Podremos divulgar información cuando ello sea requerido por:
- Orden judicial o requerimiento de autoridad competente.
- Cumplimiento de leyes vigentes (incluyendo obligaciones fiscales y de prevención de lavado de activos).
- Defensa de derechos propios o de terceros frente a reclamos o fraudes.

---

## 5. Transferencias internacionales

Algunos de nuestros proveedores almacenan datos fuera de Argentina. En esos casos, Parkit adopta medidas razonables para asegurar que la transferencia se realice a países que ofrezcan un nivel adecuado de protección o, en su defecto, mediante cláusulas contractuales que garanticen la seguridad de los datos, conforme a la **Disposición 60-E/2016 de la AAIP**.

---

## 6. Plazos de conservación

Conservamos sus datos personales mientras su cuenta esté activa y por los plazos adicionales que resulten necesarios para:

- Cumplir con obligaciones legales, contables y fiscales (en general, **10 años** para registros contables y fiscales en Argentina).
- Resolver disputas y hacer cumplir nuestros acuerdos.
- Conservar respaldos técnicos por un máximo de 90 días luego de la eliminación.

Cuando los datos ya no resulten necesarios, los eliminamos o anonimizamos de forma segura.

---

## 7. Sus derechos

De acuerdo con la Ley 25.326, usted tiene derecho a:

- **Acceder** gratuitamente a sus datos personales, en intervalos no menores a seis meses (salvo acreditación de interés legítimo).
- **Rectificar** datos inexactos o desactualizados.
- **Actualizar** sus datos.
- **Suprimir** datos cuando ya no resulten necesarios o pertinentes, sujeto a las excepciones legales.
- **Oponerse** al tratamiento para ciertas finalidades (por ejemplo, marketing).
- **Retirar el consentimiento** otorgado en cualquier momento.
- **Portabilidad:** solicitar una copia de sus datos en un formato estructurado.

Para ejercer estos derechos, escribanos a **contacto@gogoparkit.com.ar** desde el correo asociado a su cuenta. Responderemos en un plazo máximo de **10 días corridos** (acceso) o **5 días hábiles** (rectificación / supresión), conforme a la normativa vigente.

Asimismo, usted tiene derecho a presentar un reclamo ante la **Agencia de Acceso a la Información Pública (AAIP)**, órgano de control de la Ley 25.326, con domicilio en Av. Pte. Julio A. Roca 710, Piso 2°, CABA, Argentina ([www.argentina.gob.ar/aaip](https://www.argentina.gob.ar/aaip)).

### Eliminación de cuenta

Puede solicitar la eliminación total de su cuenta y sus datos:

- Desde la opción **"Eliminar cuenta"** dentro de la app, en *Configuración → Cuenta*.
- Escribiendo a **contacto@gogoparkit.com.ar**.

La eliminación se concretará dentro de los 30 días, con excepción de aquellos datos que debamos conservar por obligación legal.

---

## 8. Seguridad de la información

Aplicamos medidas técnicas y organizativas razonables para proteger sus datos:

- Comunicaciones cifradas (HTTPS/TLS) en todas las conexiones cliente-servidor.
- Almacenamiento cifrado en la base de datos (Supabase / PostgreSQL).
- Contraseñas almacenadas con algoritmos de hashing modernos (bcrypt / Argon2).
- Acceso restringido a datos por roles y políticas de Row Level Security.
- Registros de auditoría y monitoreo de accesos.
- Procesos de respuesta ante incidentes.

Pese a estos esfuerzos, ningún sistema es 100 % impenetrable. En caso de un incidente que afecte sus datos, notificaremos a la AAIP y a las personas afectadas dentro de los plazos exigidos por la normativa aplicable.

---

## 9. Niños y adolescentes

Parkit está dirigido a personas mayores de **18 años**. No recolectamos conscientemente datos de menores de esa edad. Si toma conocimiento de que un menor nos ha provisto datos personales sin autorización de sus padres o tutores, le pedimos que nos lo comunique a contacto@gogoparkit.com.ar para eliminarlos.

---

## 10. Cookies y tecnologías similares (sitio web)

El sitio web goparkit.com.ar utiliza cookies estrictamente necesarias para el funcionamiento (por ejemplo, mantener la sesión iniciada) y cookies analíticas para entender cómo se usa el sitio y mejorarlo. Puede configurar su navegador para rechazar cookies; sin embargo, algunas funciones podrían dejar de operar correctamente.

---

## 11. Cambios a esta Política

Podemos actualizar esta Política de Privacidad de forma periódica. Cuando los cambios sean sustanciales, lo notificaremos a través de la app, por correo electrónico o mediante un aviso destacado en el sitio web, con una antelación razonable a la entrada en vigor.

La fecha de la última actualización figura al inicio del documento.

---

## 12. Contacto

Si tiene preguntas, inquietudes o reclamos sobre esta Política o sobre el tratamiento de sus datos personales, contáctenos:

- **Correo:** contacto@gogoparkit.com.ar
- **Dirección postal:** Buenos Aires, Argentina

