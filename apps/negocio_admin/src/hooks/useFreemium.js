import { useMemo } from 'react';
import { useTenant } from '../context/TenantContext';

export function useFreemium() {
  const { tenant } = useTenant();

  const limits = useMemo(() => {
    const isPro = tenant?.plan === 'pro';
    
    return {
      isPro,
      isStarter: !isPro,
      maxUsers: isPro ? Infinity : 9,           // starter: 9 usuarios max
      maxFileSizeMB: isPro ? 20 : 2,           // starter: 2MB, pro: 20MB
      maxFileSizeBytes: (isPro ? 20 : 2) * 1024 * 1024,
      whiteLabelEnabled: isPro,
      planName: isPro ? 'VendeMas PRO' : 'Plan Starter'
    };
  }, [tenant]);

  const checkLimit = (type, value) => {
    if (limits.isPro) return { allowed: true };

    switch (type) {
      case 'FILE_SIZE':
        if (value > limits.maxFileSizeBytes) {
          return { 
            allowed: false, 
            reason: `El archivo supera el límite de ${limits.maxFileSizeMB}MB de tu plan. Sube archivos más grandes con el Plan Pro (hasta 20MB).` 
          };
        }
        break;
      case 'WHITE_LABEL':
        if (!limits.whiteLabelEnabled) {
          return { 
            allowed: false, 
            reason: "Desbloquea la Marca Blanca. Elimina el branding de VendeMas y usa tu propio logo en los portales y cotizaciones." 
          };
        }
        break;
      case 'USERS':
        if (!limits.isPro && value >= limits.maxUsers) {
          return { 
            allowed: false, 
            reason: `Has alcanzado el límite de ${limits.maxUsers} usuarios del Plan Starter. Actualiza a Pro para añadir más miembros a tu equipo sin límite.` 
          };
        }
        break;
      case 'BULK_IMPORT':
        if (!limits.isPro) {
          return {
            allowed: false,
            reason: 'La Carga Masiva de productos es una funcionalidad exclusiva del Plan Pro. Importa cientos de productos desde una hoja de cálculo.'
          };
        }
        break;
      default:
        return { allowed: true };
    }
    return { allowed: true };
  };

  return { ...limits, checkLimit };
}
