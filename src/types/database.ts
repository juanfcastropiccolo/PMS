export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      users: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      billetera_propietarios: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cuentas_cobro: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      withdrawals: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      movimientos_billetera: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reservas: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resenas: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      // estacionamientos: schema real puede diferir (direccion/lat/lng vs direccion_completa/latitud/longitud, etc.)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      estacionamientos: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      fotos_estacionamiento: {
        Row: {
          id: string;
          estacionamiento_id: string;
          url: string;
          storage_path: string;
          orden: number;
          es_principal: boolean;
          tamano_bytes: number | null;
          tipo_mime: string | null;
          ancho_px: number | null;
          alto_px: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['fotos_estacionamiento']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['fotos_estacionamiento']['Insert']>;
        Relationships: [];
      };
      reservas_estacionamiento: {
        Row: {
          id: string;
          estacionamiento_id: string;
          usuario_id: string;
          fecha_inicio: string;
          fecha_fin: string;
          duracion_horas: number;
          vehiculo_info: Json | null;
          codigo_reserva: string;
          codigo_qr: string | null;
          precio_por_hora: number;
          monto_total: number;
          moneda: string;
          comision_parkit: number;
          monto_propietario: number;
          estado: 'pendiente' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'no_show';
          checkin_at: string | null;
          checkout_at: string | null;
          payment_id: string | null;
          payment_status: string | null;
          payment_method: string | null;
          notas_usuario: string | null;
          notas_propietario: string | null;
          cancelada_por: string | null;
          cancelada_at: string | null;
          motivo_cancelacion: string | null;
          calificacion: number | null;
          comentario_calificacion: string | null;
          calificado_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reservas_estacionamiento']['Row'], 'id' | 'created_at' | 'updated_at' | 'duracion_horas' | 'monto_propietario'>;
        Update: Partial<Database['public']['Tables']['reservas_estacionamiento']['Insert']>;
        Relationships: [];
      };
      kyc_submissions: {
        Row: {
          id: string;
          usuario_id: string;
          estacionamiento_id: string | null;
          tipo: 'persona_fisica' | 'persona_juridica';
          nombre_completo: string | null;
          dni: string | null;
          fecha_nacimiento: string | null;
          nacionalidad: string | null;
          foto_dni_frente_url: string | null;
          foto_dni_dorso_url: string | null;
          foto_selfie_url: string | null;
          razon_social: string | null;
          cuit: string | null;
          tipo_sociedad: string | null;
          constancia_afip_url: string | null;
          estatuto_social_url: string | null;
          poder_representante_url: string | null;
          telefono: string | null;
          email: string | null;
          direccion_fiscal: string | null;
          ciudad_fiscal: string | null;
          provincia_fiscal: string | null;
          codigo_postal_fiscal: string | null;
          estado: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado' | 'requiere_info';
          revisado_por: string | null;
          revisado_at: string | null;
          motivo_rechazo: string | null;
          comentarios_revision: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kyc_submissions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['kyc_submissions']['Insert']>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'propietario' | 'admin' | 'super_admin';
          permissions: Json;
          asignado_por: string | null;
          asignado_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_roles']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>;
        Relationships: [];
      };
      resenas_estacionamiento: {
        Row: {
          id: string;
          estacionamiento_id: string;
          reserva_id: string;
          usuario_id: string;
          calificacion: number;
          comentario: string | null;
          limpieza: number | null;
          seguridad: number | null;
          accesibilidad: number | null;
          relacion_precio_calidad: number | null;
          es_verificada: boolean;
          respuesta_propietario: string | null;
          respondida_at: string | null;
          reportada: boolean;
          motivo_reporte: string | null;
          estado_moderacion: string;
          votos_utiles: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['resenas_estacionamiento']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['resenas_estacionamiento']['Insert']>;
        Relationships: [];
      };
      notificaciones: {
        Row: {
          id: string;
          usuario_id: string;
          tipo: 'estacionamiento_aprobado' | 'estacionamiento_rechazado' | 'nueva_reserva' | 'reserva_cancelada' | 'pago_recibido' | 'nueva_resena' | 'recordatorio' | 'sistema';
          titulo: string;
          mensaje: string;
          referencia_tipo: string | null;
          referencia_id: string | null;
          leida: boolean;
          leida_at: string | null;
          action_url: string | null;
          action_label: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notificaciones']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notificaciones']['Insert']>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          usuario_id: string | null;
          usuario_email: string | null;
          usuario_rol: string | null;
          accion: 'crear' | 'actualizar' | 'eliminar' | 'aprobar' | 'rechazar' | 'suspender' | 'activar';
          entidad_tipo: string;
          entidad_id: string;
          descripcion: string | null;
          cambios: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_log']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['audit_log']['Insert']>;
        Relationships: [];
      };
      early_birds: {
        Row: {
          id: string;
          email: string;
          nombre_apellido: string;
          telefono: string;
          created_at: string;
        };
        Insert: {
          email: string;
          nombre_apellido: string;
          telefono: string;
          id?: string;
          created_at?: string;
        };
        Update: {
          email?: string;
          nombre_apellido?: string;
          telefono?: string;
        };
        Relationships: [];
      };
      mp_accounts_propietarios: {
        Row: {
          id: string;
          propietario_id: string;
          mp_user_id: string;
          mp_email: string | null;
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          is_active: boolean;
          linked_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['mp_accounts_propietarios']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['mp_accounts_propietarios']['Insert']>;
        Relationships: [];
      };
    };
    Views: {
      v_estacionamientos_con_propietario: {
        Row: {
          id: string;
          propietario_id: string;
          nombre: string;
          propietario_email: string | null;
          propietario_nombre: string | null;
          propietario_telefono: string | null;
          fotos: Json | null;
          reservas_activas: number | null;
          [key: string]: unknown;
        };
        Relationships: [];
      };
      v_dashboard_propietario: {
        Row: {
          propietario_id: string;
          total_estacionamientos: number;
          estacionamientos_activos: number;
          pendientes_aprobacion: number;
          total_reservas: number;
          reservas_activas: number;
          ingresos_totales: number;
          ingresos_ultimo_mes: number;
          calificacion_promedio_general: number;
        };
        Relationships: [];
      };
      v_dashboard_admin: {
        Row: {
          total_estacionamientos: number;
          estacionamientos_activos: number;
          pendientes_aprobacion: number;
          total_propietarios: number;
          total_reservas: number;
          reservas_ultimo_mes: number;
          ingresos_totales_plataforma: number;
          ingresos_ultimo_mes: number;
          comisiones_totales: number;
          calificacion_promedio_plataforma: number;
        };
        Relationships: [];
      };
    };
    Functions: {};
    Enums: {};
  };
}

