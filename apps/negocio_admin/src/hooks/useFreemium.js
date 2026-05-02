import { useMemo } from 'react';
import { useTenant } from '../context/TenantContext';

export function useFreemium() {
  const { tenant } = useTenant();

  const limits = useMemo(() => {
    const isPro = tenant?.plan === 'premium' || tenant?.plan === 'pro';
    
    return {
      isPro,
      maxUsers: 10,
      maxFileSizeMB: isPro ? 50 : 2,
      maxFileSizeBytes: (isPro ? 50 : 2) * 1024 * 1024,
      whiteLabelEnabled: isPro,
      planName: isPro ? 'VendeMas PRO' : 'Plan Free'
    };
  }, [tenant]);

  const checkLimit = (type, value) => {
    if (limits.isPro) return { allowed: true };

    switch (type) {
      case 'FILE_SIZE':
        if (value > limits.maxFileSizeBytes) {
          return { 
            allowed: false, 
            reason: `Este archivo supera los ${limits.maxFileSizeMB}MB. Sube archivos de alta calidad con el plan Pro.` 
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
        if (value >= limits.maxUsers) {
          return { 
            allowed: false, 
            reason: `Has alcanzado el límite de ${limits.maxUsers} usuarios de tu equipo.` 
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
