'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Container,
  Link as MuiLink,
  useMediaQuery,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';

const navLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'FAQs', href: '/#faqs' },
  { label: 'Blog', href: '/#blog' },
];

export default function PoliticaPrivacidadPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ overflowX: 'hidden', bgcolor: '#fff' }}>
      {/* Navbar */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{ bgcolor: '#fff', color: theme.palette.text.primary }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 1200, width: '100%', mx: 'auto' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Box sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Image src="/logo_parkit.png" alt="Parkit" width={40} height={40} style={{ objectFit: 'contain' }} />
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '1.3rem',
                  color: theme.palette.primary.dark,
                  ml: 0.5,
                }}
              >
                parkit
              </Typography>
            </Box>
          </Link>

          {isMobile ? (
            <>
              <IconButton onClick={() => setDrawerOpen(true)}>
                <MenuIcon />
              </IconButton>
              <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <List sx={{ width: 250, pt: 2 }}>
                  {navLinks.map((link) => (
                    <ListItem key={link.href} disablePadding>
                      <ListItemButton component={Link} href={link.href} onClick={() => setDrawerOpen(false)}>
                        <ListItemText primary={link.label} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Drawer>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {navLinks.map((link) => (
                <MuiLink
                  key={link.href}
                  component={Link}
                  href={link.href}
                  underline="none"
                  sx={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: '20px',
                    px: 2,
                    py: 0.75,
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      bgcolor: 'rgba(0,119,182,0.04)',
                    },
                  }}
                >
                  {link.label}
                </MuiLink>
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Toolbar />

      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: '#fff',
          py: { xs: 5, md: 7 },
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 800, mb: 1 }}
          >
            Política de Privacidad
          </Typography>
          <Typography sx={{ opacity: 0.9, fontSize: { xs: '0.9rem', md: '1rem' } }}>
            Última actualización: 11 de mayo de 2026
          </Typography>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
        <Box
          sx={{
            '& h2': {
              fontSize: { xs: '1.4rem', md: '1.6rem' },
              fontWeight: 700,
              color: theme.palette.primary.dark,
              mt: 5,
              mb: 2,
            },
            '& h3': {
              fontSize: { xs: '1.1rem', md: '1.2rem' },
              fontWeight: 600,
              color: theme.palette.text.primary,
              mt: 3,
              mb: 1.5,
            },
            '& p': {
              fontSize: '1rem',
              lineHeight: 1.75,
              color: theme.palette.text.secondary,
              mb: 2,
            },
            '& ul': {
              pl: 3,
              mb: 2,
            },
            '& li': {
              fontSize: '1rem',
              lineHeight: 1.75,
              color: theme.palette.text.secondary,
              mb: 0.75,
            },
            '& strong': { color: theme.palette.text.primary, fontWeight: 600 },
            '& a': { color: theme.palette.primary.main },
          }}
        >
          <Typography component="p">
            Esta Política de Privacidad describe cómo <strong>Parkit</strong> (en adelante, &quot;Parkit&quot;,
            &quot;nosotros&quot; o &quot;la Plataforma&quot;) recolecta, utiliza, almacena, comparte y protege la
            información personal de las personas usuarias de la aplicación móvil Parkit, del sitio web
            goparkit.com.ar y de los servicios asociados (en adelante, los &quot;Servicios&quot;).
          </Typography>
          <Typography component="p">
            Al descargar, instalar, crear una cuenta o utilizar los Servicios, usted declara haber leído,
            comprendido y aceptado los términos de esta Política. Si no está de acuerdo, le solicitamos que no
            utilice los Servicios.
          </Typography>
          <Typography component="p">
            Parkit cumple con la <strong>Ley N° 25.326 de Protección de los Datos Personales</strong> de la
            República Argentina, su Decreto Reglamentario 1558/2001, las disposiciones emitidas por la{' '}
            <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>, y, en lo que resulta aplicable, con
            estándares internacionales como el Reglamento General de Protección de Datos (GDPR) y la California
            Consumer Privacy Act (CCPA).
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography component="h2">1. Responsable del tratamiento</Typography>
          <ul>
            <li><strong>Razón social:</strong> Parkit</li>
            <li><strong>Domicilio legal:</strong> Buenos Aires, Argentina</li>
            <li><strong>Correo electrónico de contacto:</strong> contacto@goparkit.com.ar</li>
            <li><strong>Sitio web:</strong> https://goparkit.com.ar</li>
          </ul>
          <Typography component="p">
            Para cualquier consulta relacionada con esta Política de Privacidad o con el tratamiento de sus datos
            personales, puede escribirnos al correo indicado.
          </Typography>

          <Typography component="h2">2. Información que recolectamos</Typography>

          <Typography component="h3">2.1. Información que usted nos provee</Typography>
          <ul>
            <li><strong>Datos de registro:</strong> nombre y apellido, dirección de correo electrónico, número de teléfono, contraseña (almacenada en forma cifrada), foto de perfil (opcional).</li>
            <li><strong>Datos de vehículo:</strong> marca, modelo, año, color, patente/dominio y dimensiones del vehículo (largo, ancho, alto), cuando usted decide cargarlos para usar funcionalidades vinculadas al estacionamiento.</li>
            <li><strong>Datos para publicar estacionamientos</strong> (solo para usuarios anfitriones o comerciales): dirección, fotografías del espacio, capacidad, tarifas, horarios de disponibilidad, datos fiscales (CUIT, condición frente al IVA) y datos bancarios o de MercadoPago para recibir cobros.</li>
            <li><strong>Reseñas, calificaciones, reportes y mensajes</strong> que usted publica en la Plataforma.</li>
            <li><strong>Comunicaciones</strong> que mantiene con nuestro equipo de soporte.</li>
          </ul>

          <Typography component="h3">2.2. Información que recolectamos automáticamente</Typography>
          <ul>
            <li>
              <strong>Ubicación geográfica:</strong>
              <ul>
                <li><strong>Ubicación precisa (GPS)</strong> en primer plano, para mostrarle estacionamientos cercanos, calcular rutas y brindar navegación turn-by-turn.</li>
                <li><strong>Ubicación en segundo plano</strong> <em>(opcional, solo con su consentimiento expreso)</em> para alertarle de lugares libres cercanos, detectar automáticamente que estacionó, recordar dónde dejó el vehículo y para funcionalidades de navegación que continúan con la pantalla apagada.</li>
                <li>Puede revocar este permiso en cualquier momento desde la configuración de su dispositivo. Si lo hace, ciertas funciones quedarán limitadas o no estarán disponibles.</li>
              </ul>
            </li>
            <li><strong>Datos de uso:</strong> pantallas visitadas, acciones realizadas, búsquedas, rutas calculadas, marca de tiempo de eventos, errores de la aplicación.</li>
            <li><strong>Datos del dispositivo:</strong> modelo, sistema operativo y versión, identificadores de dispositivo, idioma, zona horaria, tipo de conexión.</li>
            <li><strong>Datos de orientación y sensores:</strong> brújula, acelerómetro y giroscopio del dispositivo, utilizados para la navegación y la detección de estacionamiento.</li>
            <li><strong>Cámara y fotos:</strong> únicamente cuando usted lo autoriza, para tomar fotografías de espacios de estacionamiento (en el caso de anfitriones) o para funciones de detección visual de lugares libres. <strong>Parkit no accede a su galería de forma silenciosa.</strong></li>
          </ul>

          <Typography component="h3">2.3. Información de terceros</Typography>
          <ul>
            <li><strong>Inicio de sesión con Google o Apple:</strong> si elige autenticarse mediante Google Sign-In o Apple Sign-In, recibimos los datos básicos que esos proveedores nos comparten (nombre, correo electrónico y, en algunos casos, foto de perfil), según los permisos que usted otorgue.</li>
            <li><strong>MercadoPago:</strong> cuando realiza o recibe pagos, MercadoPago nos comparte el estado de las transacciones, identificadores de operación y el monto. <strong>Parkit nunca recibe ni almacena los datos completos de su tarjeta de crédito o débito.</strong> Esos datos son procesados directamente por MercadoPago bajo sus propios estándares de seguridad (PCI-DSS).</li>
          </ul>

          <Typography component="h2">3. Finalidades del tratamiento</Typography>
          <Typography component="p">Utilizamos su información para las siguientes finalidades:</Typography>

          <TableContainer component={Paper} sx={{ my: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.primary.main }}>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Finalidad</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Datos involucrados</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Base legal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  ['Crear y administrar su cuenta', 'Datos de registro, autenticación', 'Ejecución del contrato'],
                  ['Mostrarle estacionamientos cercanos y calcular rutas', 'Ubicación, datos de vehículo', 'Ejecución del contrato'],
                  ['Permitirle reservar, pagar y recibir cobros por estacionamientos', 'Datos de pago, reservas', 'Ejecución del contrato'],
                  ['Mostrar lugares libres reportados por la comunidad (SpotFree)', 'Ubicación, reportes', 'Interés legítimo / consentimiento'],
                  ['Mejorar la app y prevenir fraude', 'Datos de uso, dispositivo', 'Interés legítimo'],
                  ['Enviar notificaciones operativas (reservas, pagos, recordatorios)', 'Email, push tokens', 'Ejecución del contrato'],
                  ['Enviar comunicaciones promocionales', 'Email, datos de perfil', 'Consentimiento (revocable)'],
                  ['Cumplir con obligaciones legales, fiscales y regulatorias', 'Datos identificatorios, fiscales', 'Obligación legal'],
                  ['Resolver disputas, atender reclamos y proteger derechos', 'Todos los anteriores', 'Interés legítimo'],
                ].map(([fin, datos, base], i) => (
                  <TableRow key={i}>
                    <TableCell>{fin}</TableCell>
                    <TableCell>{datos}</TableCell>
                    <TableCell>{base}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography component="h2">4. Con quién compartimos su información</Typography>
          <Typography component="p">
            No vendemos sus datos personales. Compartimos información únicamente con los siguientes destinatarios,
            en la medida estrictamente necesaria:
          </Typography>

          <Typography component="h3">4.1. Proveedores de servicios (encargados del tratamiento)</Typography>

          <TableContainer component={Paper} sx={{ my: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.primary.main }}>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Proveedor</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Servicio</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Ubicación</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  ['Supabase', 'Base de datos, autenticación, almacenamiento, edge functions', 'EE.UU. y/o UE'],
                  ['Google LLC', 'Maps, Places, Directions, Geocoding, Sign-In, FCM', 'EE.UU.'],
                  ['Apple Inc.', 'Sign-In, APNs', 'EE.UU.'],
                  ['MercadoPago (Mercado Libre S.R.L.)', 'Procesamiento de pagos', 'Argentina / Brasil'],
                  ['Upstash', 'Caché Redis', 'EE.UU. / UE'],
                ].map(([prov, srv, loc], i) => (
                  <TableRow key={i}>
                    <TableCell><strong>{prov}</strong></TableCell>
                    <TableCell>{srv}</TableCell>
                    <TableCell>{loc}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography component="p">
            Todos los proveedores están obligados contractualmente a tratar los datos exclusivamente para prestar
            los Servicios contratados y bajo estándares razonables de seguridad.
          </Typography>

          <Typography component="h3">4.2. Otros usuarios de la Plataforma</Typography>
          <ul>
            <li>Cuando publica un estacionamiento o lo reserva, ciertos datos (nombre de pila, foto de perfil, calificación, vehículo aproximado) pueden ser visibles para la contraparte de la transacción.</li>
            <li>Las reseñas y comentarios públicos son visibles para todos los usuarios.</li>
          </ul>

          <Typography component="h3">4.3. Autoridades y terceros legítimos</Typography>
          <Typography component="p">Podremos divulgar información cuando ello sea requerido por:</Typography>
          <ul>
            <li>Orden judicial o requerimiento de autoridad competente.</li>
            <li>Cumplimiento de leyes vigentes (incluyendo obligaciones fiscales y de prevención de lavado de activos).</li>
            <li>Defensa de derechos propios o de terceros frente a reclamos o fraudes.</li>
          </ul>

          <Typography component="h2">5. Transferencias internacionales</Typography>
          <Typography component="p">
            Algunos de nuestros proveedores almacenan datos fuera de Argentina. En esos casos, Parkit adopta
            medidas razonables para asegurar que la transferencia se realice a países que ofrezcan un nivel
            adecuado de protección o, en su defecto, mediante cláusulas contractuales que garanticen la seguridad
            de los datos, conforme a la <strong>Disposición 60-E/2016 de la AAIP</strong>.
          </Typography>

          <Typography component="h2">6. Plazos de conservación</Typography>
          <Typography component="p">
            Conservamos sus datos personales mientras su cuenta esté activa y por los plazos adicionales que
            resulten necesarios para:
          </Typography>
          <ul>
            <li>Cumplir con obligaciones legales, contables y fiscales (en general, <strong>10 años</strong> para registros contables y fiscales en Argentina).</li>
            <li>Resolver disputas y hacer cumplir nuestros acuerdos.</li>
            <li>Conservar respaldos técnicos por un máximo de 90 días luego de la eliminación.</li>
          </ul>
          <Typography component="p">
            Cuando los datos ya no resulten necesarios, los eliminamos o anonimizamos de forma segura.
          </Typography>

          <Typography component="h2">7. Sus derechos</Typography>
          <Typography component="p">De acuerdo con la Ley 25.326, usted tiene derecho a:</Typography>
          <ul>
            <li><strong>Acceder</strong> gratuitamente a sus datos personales, en intervalos no menores a seis meses (salvo acreditación de interés legítimo).</li>
            <li><strong>Rectificar</strong> datos inexactos o desactualizados.</li>
            <li><strong>Actualizar</strong> sus datos.</li>
            <li><strong>Suprimir</strong> datos cuando ya no resulten necesarios o pertinentes, sujeto a las excepciones legales.</li>
            <li><strong>Oponerse</strong> al tratamiento para ciertas finalidades (por ejemplo, marketing).</li>
            <li><strong>Retirar el consentimiento</strong> otorgado en cualquier momento.</li>
            <li><strong>Portabilidad:</strong> solicitar una copia de sus datos en un formato estructurado.</li>
          </ul>
          <Typography component="p">
            Para ejercer estos derechos, escribanos a <strong>contacto@goparkit.com.ar</strong> desde el correo
            asociado a su cuenta. Responderemos en un plazo máximo de <strong>10 días corridos</strong> (acceso)
            o <strong>5 días hábiles</strong> (rectificación / supresión), conforme a la normativa vigente.
          </Typography>
          <Typography component="p">
            Asimismo, usted tiene derecho a presentar un reclamo ante la{' '}
            <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>, órgano de control de la Ley
            25.326, con domicilio en Av. Pte. Julio A. Roca 710, Piso 2°, CABA, Argentina (
            <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer">
              www.argentina.gob.ar/aaip
            </a>
            ).
          </Typography>

          <Typography component="h3">Eliminación de cuenta</Typography>
          <Typography component="p">Puede solicitar la eliminación total de su cuenta y sus datos:</Typography>
          <ul>
            <li>Desde la opción <strong>&quot;Eliminar cuenta&quot;</strong> dentro de la app, en <em>Configuración → Cuenta</em>.</li>
            <li>Escribiendo a <strong>contacto@goparkit.com.ar</strong>.</li>
          </ul>
          <Typography component="p">
            La eliminación se concretará dentro de los 30 días, con excepción de aquellos datos que debamos
            conservar por obligación legal.
          </Typography>

          <Typography component="h2">8. Seguridad de la información</Typography>
          <Typography component="p">Aplicamos medidas técnicas y organizativas razonables para proteger sus datos:</Typography>
          <ul>
            <li>Comunicaciones cifradas (HTTPS/TLS) en todas las conexiones cliente-servidor.</li>
            <li>Almacenamiento cifrado en la base de datos (Supabase / PostgreSQL).</li>
            <li>Contraseñas almacenadas con algoritmos de hashing modernos (bcrypt / Argon2).</li>
            <li>Acceso restringido a datos por roles y políticas de Row Level Security.</li>
            <li>Registros de auditoría y monitoreo de accesos.</li>
            <li>Procesos de respuesta ante incidentes.</li>
          </ul>
          <Typography component="p">
            Pese a estos esfuerzos, ningún sistema es 100% impenetrable. En caso de un incidente que afecte sus
            datos, notificaremos a la AAIP y a las personas afectadas dentro de los plazos exigidos por la
            normativa aplicable.
          </Typography>

          <Typography component="h2">9. Niños y adolescentes</Typography>
          <Typography component="p">
            Parkit está dirigido a personas mayores de <strong>18 años</strong>. No recolectamos conscientemente
            datos de menores de esa edad. Si toma conocimiento de que un menor nos ha provisto datos personales
            sin autorización de sus padres o tutores, le pedimos que nos lo comunique a
            contacto@goparkit.com.ar para eliminarlos.
          </Typography>

          <Typography component="h2">10. Cookies y tecnologías similares (sitio web)</Typography>
          <Typography component="p">
            El sitio web goparkit.com.ar utiliza cookies estrictamente necesarias para el funcionamiento (por
            ejemplo, mantener la sesión iniciada) y cookies analíticas para entender cómo se usa el sitio y
            mejorarlo. Puede configurar su navegador para rechazar cookies; sin embargo, algunas funciones
            podrían dejar de operar correctamente.
          </Typography>

          <Typography component="h2">11. Cambios a esta Política</Typography>
          <Typography component="p">
            Podemos actualizar esta Política de Privacidad de forma periódica. Cuando los cambios sean
            sustanciales, lo notificaremos a través de la app, por correo electrónico o mediante un aviso
            destacado en el sitio web, con una antelación razonable a la entrada en vigor.
          </Typography>
          <Typography component="p">La fecha de la última actualización figura al inicio del documento.</Typography>

          <Typography component="h2">12. Contacto</Typography>
          <Typography component="p">
            Si tiene preguntas, inquietudes o reclamos sobre esta Política o sobre el tratamiento de sus datos
            personales, contáctenos:
          </Typography>
          <ul>
            <li><strong>Correo:</strong> contacto@goparkit.com.ar</li>
            <li><strong>Dirección postal:</strong> Buenos Aires, Argentina</li>
          </ul>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: theme.palette.primary.dark,
          color: '#fff',
          py: 4,
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Image src="/logo_parkit.png" alt="Parkit" width={33} height={33} style={{ objectFit: 'contain' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>parkit</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
            <MuiLink
              component={Link}
              href="/"
              sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
            >
              Inicio
            </MuiLink>
            <MuiLink
              component={Link}
              href="/privacidad"
              sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
            >
              Privacidad
            </MuiLink>
          </Box>

          <Typography variant="body2" sx={{ opacity: 0.6 }}>
            &copy; {new Date().getFullYear()} Parkit. Todos los derechos reservados.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
