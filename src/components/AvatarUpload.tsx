'use client';

import { useState, useRef } from 'react';
import { Box, Avatar, IconButton, CircularProgress, Tooltip } from '@mui/material';
import { PhotoCamera, Edit as EditIcon } from '@mui/icons-material';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userId: string;
  userName: string;
  size?: number;
  onAvatarUploaded?: (url: string) => void;
}

export default function AvatarUpload({
  currentAvatarUrl,
  userId,
  userName,
  size = 150,
  onAvatarUploaded,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar 2MB');
      return;
    }

    setUploading(true);

    try {
      // Construir path del archivo
      const fileName = 'avatar.jpg';
      const filePath = `${userId}/${fileName}`;

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Reemplazar si ya existe
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Agregar timestamp para evitar cache
      const finalUrl = `${publicUrl}?t=${Date.now()}`;

      // Actualizar la tabla users con la nueva URL
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('users')
        .update({ foto_perfil_url: finalUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setAvatarUrl(finalUrl);
      toast.success('Foto de perfil actualizada exitosamente');
      
      if (onAvatarUploaded) {
        onAvatarUploaded(finalUrl);
      }
    } catch (error: unknown) {
      console.error('Error uploading avatar:', error);
      toast.error(`Error al subir la foto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        cursor: 'pointer',
        '&:hover .edit-overlay': {
          opacity: 1,
        },
      }}
      onClick={handleButtonClick}
    >
      {/* Avatar */}
      <Avatar
        src={avatarUrl || undefined}
        sx={{
          width: size,
          height: size,
          bgcolor: '#00B4D8',
          fontSize: size / 3,
          fontWeight: 600,
        }}
      >
        {!avatarUrl && getInitials(userName)}
      </Avatar>

      {/* Overlay con botón de editar */}
      <Box
        className="edit-overlay"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        {uploading ? (
          <CircularProgress sx={{ color: 'white' }} size={40} />
        ) : (
          <Tooltip title="Cambiar foto de perfil">
            <IconButton
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  backgroundColor: 'white',
                },
              }}
            >
              {avatarUrl ? <EditIcon /> : <PhotoCamera />}
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
    </Box>
  );
}



