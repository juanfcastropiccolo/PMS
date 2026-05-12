'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';

const navLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'FAQs', href: '/#faqs' },
  { label: 'Blog', href: '/#blog' },
];

interface Props {
  title: string;
  lastUpdated: string;
  content: string;
}

/**
 * Layout shared para páginas legales (Política de Privacidad, Términos).
 * Renderiza un .md con react-markdown + GFM (tablas, listas, links) dentro
 * del shell del sitio (AppBar + header hero + footer).
 *
 * Los .md viven en /legal/*.md y son la single source of truth (los mismos
 * que se muestran in-app en parkit_app).
 */
export default function LegalDocPage({ title, lastUpdated, content }: Props) {
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
              <Image
                src="/logo_parkit.png"
                alt="Parkit"
                width={40}
                height={40}
                style={{ objectFit: 'contain' }}
              />
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

          {!isMobile ? (
            <Box sx={{ display: 'flex', gap: 3 }}>
              {navLinks.map((l) => (
                <MuiLink
                  key={l.href}
                  component={Link}
                  href={l.href}
                  underline="none"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 500,
                    '&:hover': { color: theme.palette.primary.main },
                  }}
                >
                  {l.label}
                </MuiLink>
              ))}
            </Box>
          ) : (
            <IconButton onClick={() => setDrawerOpen(true)} edge="end">
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List sx={{ width: 220 }}>
          {navLinks.map((l) => (
            <ListItem key={l.href} disablePadding>
              <ListItemButton
                component={Link}
                href={l.href}
                onClick={() => setDrawerOpen(false)}
              >
                <ListItemText primary={l.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Spacer del AppBar fijo */}
      <Toolbar />

      {/* Header hero */}
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
            {title}
          </Typography>
          <Typography sx={{ opacity: 0.9, fontSize: { xs: '0.9rem', md: '1rem' } }}>
            Última actualización: {lastUpdated}
          </Typography>
        </Container>
      </Box>

      {/* Contenido renderizado desde markdown */}
      <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
        <Box
          sx={{
            // Quitamos el H1 del .md (ya lo mostramos en el header hero)
            '& > div > h1:first-of-type': { display: 'none' },
            '& h2': {
              fontSize: { xs: '1.4rem', md: '1.6rem' },
              fontWeight: 700,
              color: theme.palette.primary.dark,
              mt: 5,
              mb: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              pb: 1,
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
              lineHeight: 1.7,
              color: theme.palette.text.primary,
              my: 1.5,
            },
            '& ul, & ol': { pl: 3, my: 1.5 },
            '& li': { mb: 0.8, lineHeight: 1.65 },
            '& a': {
              color: theme.palette.primary.main,
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            },
            '& strong': { fontWeight: 700 },
            '& blockquote': {
              borderLeft: `4px solid ${theme.palette.primary.light}`,
              pl: 2,
              py: 0.5,
              my: 2,
              color: theme.palette.text.secondary,
              bgcolor: 'rgba(0,0,0,0.02)',
              fontStyle: 'italic',
            },
            '& code': {
              bgcolor: 'rgba(0,0,0,0.05)',
              px: 0.8,
              py: 0.2,
              borderRadius: 0.5,
              fontFamily: 'monospace',
              fontSize: '0.9em',
            },
            '& table': {
              width: '100%',
              borderCollapse: 'collapse',
              my: 2,
              fontSize: '0.95rem',
            },
            '& th, & td': {
              border: `1px solid ${theme.palette.divider}`,
              p: 1.2,
              textAlign: 'left',
              verticalAlign: 'top',
            },
            '& th': {
              bgcolor: 'rgba(0,0,0,0.04)',
              fontWeight: 600,
            },
            '& hr': {
              border: 0,
              borderTop: `1px solid ${theme.palette.divider}`,
              my: 4,
            },
          }}
        >
          <div>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          bgcolor: theme.palette.primary.dark,
          color: '#fff',
          py: 5,
          mt: { xs: 4, md: 6 },
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
            <Image
              src="/logo_parkit.png"
              alt="Parkit"
              width={33}
              height={33}
              style={{ objectFit: 'contain' }}
            />
            <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>
              parkit
            </Typography>
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
            <MuiLink
              component={Link}
              href="/terminos"
              sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
            >
              Términos
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
