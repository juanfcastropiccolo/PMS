'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  TextField,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Link as MuiLink,
  useMediaQuery,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuIcon from '@mui/icons-material/Menu';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';

const navLinks = [
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'FAQs', href: '#faqs' },
  { label: 'Blog', href: '#blog' },
];

const faqs = [
  {
    q: '¿Qué es Parkit?',
    a: 'Parkit es una plataforma que te ayuda a encontrar estacionamiento de forma rápida y sencilla. Ya sea en la calle, en estacionamientos privados o cocheras particulares, Parkit centraliza todas las opciones en un solo lugar.',
  },
  {
    q: '¿Cómo funciona Parkit?',
    a: 'Parkit te muestra un mapa con las alternativas de estacionamiento disponibles cerca tuyo: lugares en la vía pública, playas de estacionamiento privadas y cocheras de particulares. Vos elegís la opción que más te convenga.',
  },
  {
    q: '¿Parkit es solo para estacionar en la calle?',
    a: 'No. Parkit es un marketplace que combina opciones de vía pública, playas de estacionamiento privadas y cocheras de particulares. Todo en un solo lugar.',
  },
  {
    q: '¿Parkit es gratis?',
    a: 'Sí, explorar las opciones de estacionamiento es gratis. Los estacionamientos privados y cocheras tienen sus propias tarifas definidas por cada proveedor.',
  },
  {
    q: '¿Puedo ver estacionamientos privados desde la app?',
    a: 'Sí. Parkit centraliza todas las opciones disponibles, incluyendo playas privadas y cocheras particulares, para que puedas comparar y elegir.',
  },
  {
    q: '¿Los precios los define Parkit?',
    a: 'No. Cada proveedor o dueño de estacionamiento define sus propios precios. Parkit solo te muestra las opciones disponibles.',
  },
  {
    q: '¿Parkit me garantiza lugar?',
    a: 'Parkit no puede garantizar disponibilidad, pero aumenta enormemente tus chances de encontrar lugar al mostrarte múltiples alternativas cercanas en tiempo real.',
  },
  {
    q: '¿De dónde sale la información de lugares en la calle?',
    a: 'La información se genera a partir del movimiento de usuarios, reportes colaborativos y análisis de patrones de estacionamiento. Cuantos más usuarios, más precisa es la información.',
  },
  {
    q: '¿Necesito cuenta para usar Parkit?',
    a: 'Podés explorar las opciones sin registrarte. Para acceder a funciones avanzadas como reservas y favoritos, necesitás crear una cuenta gratuita.',
  },
  {
    q: '¿Parkit usa mi ubicación?',
    a: 'Sí, pero solo para mostrarte los estacionamientos más cercanos. Tu ubicación se usa exclusivamente para mejorar tu experiencia.',
  },
  {
    q: '¿En qué ciudades funciona Parkit?',
    a: 'Parkit comienza operando en zonas específicas y se expande progresivamente. ¡Seguinos para enterarte cuando lleguemos a tu zona!',
  },
  {
    q: '¿Puedo elegir entre estacionar en la calle o en un privado?',
    a: 'Sí. Parkit te muestra todas las opciones disponibles y vos decidís qué te conviene más según precio, ubicación y disponibilidad.',
  },
  {
    q: '¿Parkit permite reservar?',
    a: 'Depende del estacionamiento o proveedor. Algunos permiten reserva anticipada a través de la plataforma.',
  },
  {
    q: '¿Cómo se suman los estacionamientos privados?',
    a: 'Los dueños de estacionamientos y cocheras pueden publicar sus espacios en la plataforma y empezar a recibir clientes.',
  },
  {
    q: '¿Parkit reemplaza al GPS?',
    a: 'No. Parkit complementa tu GPS. Te ayuda a encontrar dónde estacionar y luego podés usar tu navegador preferido para llegar.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Sí. Tus datos están protegidos y no se comparten con terceros. La seguridad y privacidad son prioridad para nosotros.',
  },
  {
    q: '¿Cómo mejora Parkit con el tiempo?',
    a: 'Cuantos más usuarios usen Parkit, más opciones y más precisión. El sistema aprende de los patrones de uso para ofrecerte mejores resultados.',
  },
  {
    q: '¿Cómo puedo ayudar?',
    a: 'Usando la app, reportando información, y recomendando Parkit a otros conductores. ¡Cada usuario hace la diferencia!',
  },
];

function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

export default function LandingPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [nombreApellido, setNombreApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const heroImage = useMemo(() => {
    const variant = Math.random() > 0.5 ? 'landing_page_hombre_nueva' : 'landing_page_mujer_nueva';
    return `${SUPABASE_URL}/storage/v1/object/public/branding/${variant}.png`;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!nombreApellido.trim()) {
      setMessage({ type: 'error', text: 'Ingresá tu nombre y apellido.' });
      return;
    }
    if (!telefono.trim()) {
      setMessage({ type: 'error', text: 'Ingresá tu teléfono.' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: 'Por favor ingresá un email válido.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/early-birds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nombre_apellido: nombreApellido, telefono }),
      });
      const data = await res.json();

      if (res.ok) {
        // Notificar n8n (fire-and-forget)
        const primerNombre = nombreApellido.trim().split(/\s+/)[0];
        fetch('https://energia.app.n8n.cloud/webhook/fa23033b-2571-4804-9854-b8f6d5ebf16b', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, nombre: primerNombre }),
        }).catch(() => {});

        setMessage({
          type: 'success',
          text: '¡Tu correo fue registrado! Estate atento a las novedades, te vamos a avisar cuando lancemos.',
        });
        setNombreApellido('');
        setTelefono('');
        setEmail('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Ocurrió un error. Intentá de nuevo.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión. Intentá de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ overflowX: 'hidden', bgcolor: '#fff' }}>
      {/* Navbar */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{ bgcolor: '#fff', color: theme.palette.text.primary }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 1200, width: '100%', mx: 'auto' }}>
          <Box
            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
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

          {isMobile ? (
            <>
              <IconButton onClick={() => setDrawerOpen(true)}>
                <MenuIcon />
              </IconButton>
              <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <List sx={{ width: 250, pt: 2 }}>
                  {navLinks.map((link) => (
                    <ListItem key={link.href} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          scrollTo(link.href.replace('#', ''));
                          setDrawerOpen(false);
                        }}
                      >
                        <ListItemText primary={link.label} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  <ListItem disablePadding>
                    <Tooltip title="Muy pronto vas a poder acceder a tu cuenta desde acá 😉" arrow>
                      <ListItemButton sx={{ color: 'grey.500', cursor: 'not-allowed' }}>
                        <ListItemText primary="Accedé a tu cuenta" />
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                </List>
              </Drawer>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {navLinks.map((link) => (
                <Box
                  key={link.href}
                  component="button"
                  onClick={() => scrollTo(link.href.replace('#', ''))}
                  sx={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: '20px',
                    px: 2,
                    py: 0.75,
                    bgcolor: 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      bgcolor: 'rgba(0,119,182,0.04)',
                    },
                  }}
                >
                  {link.label}
                </Box>
              ))}
              <Tooltip title="Muy pronto vas a poder acceder a tu cuenta desde acá 😉" arrow>
                <Box
                  component="span"
                  sx={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: 'grey.400',
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderRadius: '20px',
                    px: 2,
                    py: 0.75,
                    cursor: 'not-allowed',
                    userSelect: 'none',
                  }}
                >
                  Accedé a tu cuenta
                </Box>
              </Tooltip>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Spacer for fixed navbar */}
      <Toolbar />

      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.main} 100%)`,
          color: '#fff',
          py: { xs: 6, md: 10 },
          minHeight: { md: '80vh' },
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              gap: { xs: 4, md: 6 },
            }}
          >
            {/* Text + CTA */}
            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2rem', md: '3rem' },
                  fontWeight: 800,
                  mb: 2,
                  lineHeight: 1.2,
                }}
              >
                Estacioná sin vueltas
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 400,
                  mb: 4,
                  opacity: 0.9,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  lineHeight: 1.6,
                }}
              >
                Pronto vas a poder encontrar estacionamiento en la calle, en playas privadas o cocheras cerca tuyo.
                Todo en un solo lugar, rápido y simple.
              </Typography>

              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  maxWidth: 500,
                  mx: { xs: 'auto', md: 0 },
                }}
              >
                <TextField
                  type="text"
                  placeholder="Tu nombre y apellido"
                  value={nombreApellido}
                  onChange={(e) => setNombreApellido(e.target.value)}
                  size="medium"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#fff',
                      borderRadius: 2,
                      '& fieldset': { borderColor: 'transparent' },
                      '&:hover fieldset': { borderColor: theme.palette.primary.light },
                      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.light },
                    },
                  }}
                />
                <TextField
                  type="tel"
                  placeholder="Tu teléfono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  size="medium"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#fff',
                      borderRadius: 2,
                      '& fieldset': { borderColor: 'transparent' },
                      '&:hover fieldset': { borderColor: theme.palette.primary.light },
                      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.light },
                    },
                  }}
                />
                <TextField
                  type="email"
                  placeholder="Tu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  size="medium"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#fff',
                      borderRadius: 2,
                      '& fieldset': { borderColor: 'transparent' },
                      '&:hover fieldset': { borderColor: theme.palette.primary.light },
                      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.light },
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{
                    bgcolor: '#00B4D8',
                    color: '#fff',
                    fontWeight: 700,
                    py: 1.5,
                    fontSize: '0.95rem',
                    '&:hover': { bgcolor: '#0096C7' },
                  }}
                >
                  {loading ? 'Enviando...' : 'Avisame cuando salga'}
                </Button>
              </Box>

              {message && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 2,
                    maxWidth: 500,
                    mx: { xs: 'auto', md: 0 },
                    bgcolor: message.type === 'success' ? 'success.light' : 'error.light',
                    color: message.type === 'success' ? 'success.contrastText' : 'error.contrastText',
                  }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    {message.text}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Hero Image */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                maxWidth: { xs: 350, md: 500 },
              }}
            >
              <Image
                src={heroImage}
                alt="Parkit - Estacioná sin vueltas"
                width={500}
                height={500}
                style={{
                  objectFit: 'cover',
                  width: '100%',
                  height: 'auto',
                  borderRadius: '24px',
                }}
                priority
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Nosotros */}
      <Box id="nosotros" sx={{ py: { xs: 6, md: 10 }, bgcolor: '#f8fafc' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, mb: 3, color: theme.palette.primary.dark }}
          >
            Nosotros
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontSize: '1.1rem', lineHeight: 1.8, color: theme.palette.text.secondary, mb: 3 }}
          >
            Parkit nace de una frustración que todos conocemos: dar vueltas buscando dónde estacionar.
            Somos un equipo que cree que encontrar estacionamiento no debería ser una odisea.
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontSize: '1.1rem', lineHeight: 1.8, color: theme.palette.text.secondary }}
          >
            Nuestra plataforma conecta conductores con todas las opciones de estacionamiento disponibles
            — desde lugares en la calle hasta playas privadas y cocheras de particulares —
            para que estacionar sea rápido, simple y sin estrés.
          </Typography>
        </Container>
      </Box>

      {/* FAQs */}
      <Box id="faqs" sx={{ py: { xs: 6, md: 10 } }}>
        <Container maxWidth="md">
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, mb: 4, textAlign: 'center', color: theme.palette.primary.dark }}
          >
            Preguntas Frecuentes
          </Typography>
          {faqs.map((faq, i) => (
            <Accordion
              key={i}
              sx={{
                mb: 1,
                '&:before': { display: 'none' },
                borderRadius: '8px !important',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={600}>{faq.q}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{faq.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </Box>

      {/* Blog */}
      <Box id="blog" sx={{ py: { xs: 6, md: 10 }, bgcolor: '#f8fafc' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, mb: 3, color: theme.palette.primary.dark }}
          >
            Blog
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontSize: '1.1rem' }}>
            Próximamente vamos a compartir novedades, tips y todo lo que necesitás saber sobre
            estacionamiento inteligente. ¡Quedate atento!
          </Typography>
        </Container>
      </Box>

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
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '1.2rem',
                color: '#fff',
              }}
            >
              parkit
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
            {navLinks.map((link) => (
              <MuiLink
                key={link.href}
                component="button"
                onClick={() => scrollTo(link.href.replace('#', ''))}
                sx={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.9rem',
                  '&:hover': { color: '#fff' },
                }}
              >
                {link.label}
              </MuiLink>
            ))}
            <MuiLink
              href="/privacidad"
              sx={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.9rem',
                '&:hover': { color: '#fff' },
              }}
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
