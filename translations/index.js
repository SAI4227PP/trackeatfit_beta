import { teTranslations } from './te';
import { hiTranslations } from './hi';

export const translations = {
  en: {
    common: {
      language: 'Language',
      save: 'Save Changes',
      saving: 'Saving...',
      settings: 'Language Settings',
      back: 'Back',
    },
    language: {
      infoTitle: 'Language Settings',
      infoText: 'Choose your preferred language. This will change the app\'s interface and content language.',
      suggestedLanguages: 'SUGGESTED LANGUAGES',
      allLanguages: 'ALL LANGUAGES',
      updateSuccess: 'Language Updated',
      updateMessage: 'The app will restart to apply the language changes.',
      error: 'Failed to update language settings',
    },
    profile: {
      title: 'Profile',
      memberSince: 'Member since',
      level: 'Level',
      premium: 'Premium Member',
      nutritionOverview: 'Nutrition Overview',
      dailyCalories: 'Daily Calories',
      waterIntake: 'Water Intake',
      activeDays: 'Active Days',
      protein: 'Protein',
      achievements: 'Achievements',
      seeAll: 'See All',
      noAchievements: 'No achievements unlocked yet',
      sections: {
        healthGoals: 'HEALTH GOALS',
        accountSettings: 'ACCOUNT SETTINGS',
        trackingAnalysis: 'TRACKING & ANALYSIS',
        preferences: 'PREFERENCES'
      },
      options: {
        userDetails: 'Update User Details',
        weightGoal: 'Update Weight Goal',
        mealSchedule: 'Meal Schedule',
        email: 'Change Email',
        password: 'Change Password',
        phone: 'Add Phone Number',
        reports: 'Progress Reports',
        apps: 'Connected Apps',
        devices: 'Connected Device',
        export: 'Export Data',
        notifications: 'Notifications',
        language: 'Language',
        darkMode: 'Dark Mode',
        changeEmail: 'Change Email',
        changePassword: 'Change Password',
        addPhoneNumber: 'Add Phone Number',
        progressReports: 'Progress Reports',
        connectedApps: 'Connected Apps',
        connectedDevices: 'Connected Devices',
        exportData: 'Export Data',
        signOut: 'Sign Out'
      },
      signOut: 'Sign Out',
      signingOut: 'Signing Out...',
      status: {
        novice: 'Nutrition Novice',
        explorer: 'Health Explorer',
        seeker: 'Wellness Seeker',
        enthusiast: 'Fitness Enthusiast',
        champion: 'Health Champion',
        pro: 'Nutrition Pro',
        warrior: 'Wellness Warrior',
        expert: 'Health Expert',
        elite: 'Elite Achiever',
        master: 'Wellness Master'
      },
      stats: {
        dailyCalories: 'Daily Calories',
        waterIntake: 'Water Intake',
        activeDays: 'Active Days',
        protein: 'Protein',
        kcal: 'kcal',
        L: 'L',
        week: '/week',
        g: 'g'
      }
    }
  },
  te: teTranslations,
  hi: hiTranslations,
  es: {
    common: {
      language: 'Idioma',
      save: 'Guardar Cambios',
      saving: 'Guardando...',
      settings: 'Configuración de idioma',
      back: 'Volver',
    },
    language: {
      infoTitle: 'Configuración de idioma',
      infoText: 'Elige tu idioma preferido. Esto cambiará la interfaz y el contenido de la aplicación.',
      suggestedLanguages: 'IDIOMAS SUGERIDOS',
      allLanguages: 'TODOS LOS IDIOMAS',
      updateSuccess: 'Idioma Actualizado',
      updateMessage: 'La aplicación se reiniciará para aplicar los cambios de idioma.',
      error: 'Error al actualizar la configuración del idioma',
    },
    profile: {
      title: 'Perfil',
      memberSince: 'Miembro desde',
      level: 'Nivel',
      premium: 'Miembro Premium',
      nutritionOverview: 'Resumen Nutricional',
      dailyCalories: 'Calorías Diarias',
      waterIntake: 'Consumo de Agua',
      activeDays: 'Días Activos',
      protein: 'Proteína',
      achievements: 'Logros',
      seeAll: 'Ver Todos',
      noAchievements: 'Aún no hay logros desbloqueados',
      sections: {
        healthGoals: 'OBJETIVOS DE SALUD',
        accountSettings: 'CONFIGURACIÓN DE CUENTA',
        trackingAnalysis: 'SEGUIMIENTO Y ANÁLISIS',
        preferences: 'PREFERENCIAS'
      },
      options: {
        userDetails: 'Actualizar Datos de Usuario',
        weightGoal: 'Actualizar Meta de Peso',
        mealSchedule: 'Horario de Comidas',
        email: 'Cambiar Email',
        password: 'Cambiar Contraseña',
        phone: 'Agregar Número de Teléfono',
        reports: 'Informes de Progreso',
        apps: 'Aplicaciones Conectadas',
        devices: 'Dispositivo Conectado',
        export: 'Exportar Datos',
        notifications: 'Notificaciones',
        language: 'Idioma',
        darkMode: 'Modo Oscuro'
      },
      signOut: 'Cerrar Sesión',
      signingOut: 'Cerrando Sesión...',
      guest: 'Usuario Invitado',
      camera: 'Cambiar Foto',
      status: {
        novice: 'Novato en Nutrición',
        explorer: 'Explorador de Salud',
        seeker: 'Buscador de Bienestar',
        enthusiast: 'Entusiasta del Fitness',
        champion: 'Campeón de Salud',
        pro: 'Pro de Nutrición',
        warrior: 'Guerrero del Bienestar',
        expert: 'Experto en Salud',
        elite: 'Logrador Elite',
        master: 'Maestro del Bienestar'
      },
      stats: {
        dailyCalories: 'Calorías Diarias',
        waterIntake: 'Consumo de Agua',
        activeDays: 'Días Activos',
        protein: 'Proteína',
        kcal: 'kcal',
        L: 'L',
        week: '/semana',
        g: 'g'
      }
    }
  }
};

export * from './te';
export * from './hi';
