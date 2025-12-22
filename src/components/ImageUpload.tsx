'use client';

import { useState, useRef } from 'react';
import { Box, IconButton, CircularProgress, Tooltip, Typography } from '@mui/material';
import { PhotoCamera, Edit as EditIcon } from '@mui/icons-material';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  userId: string;
  estacionamientoId: string;
  tipo: 'perfil' | 'portada';
  width?: number | string;
  height?: number | string;
  borderRadius?: string;
}

export default function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  userId,
  estacionamientoId,
  tipo,
  width = '100%',
  height = '100%',
  borderRadius = '0',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5MB');
      return;
    }

    setUploading(true);

    try {
      // Crear preview local
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Construir path del archivo
      const fileName = `${tipo}.jpg`;
      const filePath = `${userId}/${estacionamientoId}/${fileName}`;

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('estacionamientos-pms')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Reemplazar si ya existe
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('estacionamientos-pms')
        .getPublicUrl(filePath);

      // Agregar timestamp para evitar cache
      const finalUrl = `${publicUrl}?t=${Date.now()}`;

      // Actualizar la tabla estacionamientos con la nueva URL
      const columnName = tipo === 'perfil' ? 'foto_perfil_url' : 'foto_portada_url';
      const { error: updateError } = await supabase
        .from('estacionamientos')
        .update({ [columnName]: finalUrl })
        .eq('id', estacionamientoId)
        .eq('propietario_id', userId);

      if (updateError) throw updateError;

      toast.success(`Foto de ${tipo} actualizada exitosamente`);
      onImageUploaded(finalUrl);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(`Error al subir la imagen: ${error.message}`);
      setPreviewUrl(currentImageUrl); // Revertir preview
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        backgroundColor: '#f0f2f5',
        backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          '& .upload-overlay': {
            opacity: 1,
          },
        },
      }}
      onClick={handleButtonClick}
    >
      {/* Overlay con botón de upload */}
      <Box
        className="upload-overlay"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: previewUrl ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      >
        {uploading ? (
          <CircularProgress sx={{ color: 'white' }} />
        ) : (
          <Tooltip title={`Subir foto de ${tipo}`}>
            <IconButton
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  backgroundColor: 'white',
                },
              }}
            >
              {previewUrl ? <EditIcon /> : <PhotoCamera />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Placeholder text cuando no hay imagen */}
      {!previewUrl && !uploading && (
        <Box
          sx={{
            position: 'absolute',
            textAlign: 'center',
            color: '#65676b',
            pointerEvents: 'none',
          }}
        >
          <PhotoCamera sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
          <Typography variant="body2">
            {tipo === 'perfil' ? 'Agregar foto de perfil' : 'Agregar portada'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

