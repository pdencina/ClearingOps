// ============================================================
// KLAP CORE — Merchant Onboarding Engine
// Motor de onboarding con flujo de 7 pasos para alta de comercios
// ============================================================

export interface OnboardingProcess {
  id: string
  merchant_name: string
  rut: string
  status: 'pending_docs' | 'kyc_review' | 'risk_assessment' | 'contract_signing' | 'terminal_setup' | 'testing' | 'active'
  current_step: number
  total_steps: number
  steps: OnboardingStep[]
  risk_score: number
  estimated_completion: string
  assigned_to: string
}

export interface OnboardingStep {
  id: number
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  required_docs: string[]
  completed_docs: string[]
  notes: string | null
}

const ONBOARDING_STEPS: Omit<OnboardingStep, 'status' | 'completed_docs' | 'notes'>[] = [
  { id: 1, name: 'Documentación', required_docs: ['RUT Empresa', 'Escritura Social', 'Poder del Representante', 'Cédula de Identidad'] },
  { id: 2, name: 'Revisión KYC', required_docs: ['Verificación de Identidad', 'Lista de Sanciones', 'PEP Check', 'Verificación de Domicilio'] },
  { id: 3, name: 'Evaluación de Riesgo', required_docs: ['Informe Comercial', 'Estados Financieros', 'Declaración de Renta', 'Historial Crediticio'] },
  { id: 4, name: 'Firma de Contrato', required_docs: ['Contrato de Afiliación', 'Anexo de Comisiones', 'Pagaré de Garantía', 'Mandato de Cobro'] },
  { id: 5, name: 'Configuración Terminal', required_docs: ['Solicitud de Terminal', 'Certificado de Instalación', 'Fotos del Local'] },
  { id: 6, name: 'Testing', required_docs: ['Test de Conexión', 'Transacción de Prueba', 'Validación de Cierre'] },
  { id: 7, name: 'Go Live', required_docs: ['Aprobación Final', 'Activación en Producción'] },
]

const STATUS_BY_STEP: OnboardingProcess['status'][] = [
  'pending_docs', 'kyc_review', 'risk_assessment', 'contract_signing', 'terminal_setup', 'testing', 'active'
]

// Simulated onboarding processes
const processes: OnboardingProcess[] = [
  createProcess('ONB-001', 'Farmacia Cruz Verde Ltda.', '76.123.456-7', 4, 'María González', 62),
  createProcess('ONB-002', 'Restaurante Don Pepe SpA', '76.987.654-3', 2, 'Carlos Muñoz', 35),
  createProcess('ONB-003', 'Supermercado El Ahorro', '76.555.222-1', 6, 'Andrea Soto', 78),
  createProcess('ONB-004', 'Estación de Servicio Copec #1245', '76.111.333-K', 1, 'Roberto Díaz', 25),
  createProcess('ONB-005', 'Tienda Deportiva ProSport', '76.444.888-5', 5, 'María González', 55),
  createProcess('ONB-006', 'Clínica Dental Sonrisa', '76.222.777-9', 3, 'Carlos Muñoz', 48),
  createProcess('ONB-007', 'Ferretería El Maestro', '76.333.111-2', 7, 'Andrea Soto', 90),
]

function createProcess(id: string, name: string, rut: string, currentStep: number, assignedTo: string, riskScore: number): OnboardingProcess {
  const steps: OnboardingStep[] = ONBOARDING_STEPS.map((step, index) => {
    let status: OnboardingStep['status'] = 'pending'
    let completedDocs: string[] = []

    if (index + 1 < currentStep) {
      status = 'completed'
      completedDocs = step.required_docs
    } else if (index + 1 === currentStep) {
      status = 'in_progress'
      completedDocs = step.required_docs.slice(0, Math.floor(step.required_docs.length * 0.6))
    }

    return {
      ...step,
      status,
      completed_docs: completedDocs,
      notes: status === 'in_progress' ? 'En proceso de revisión' : null,
    }
  })

  const daysLeft = (7 - currentStep + 1) * 3
  const estimatedDate = new Date()
  estimatedDate.setDate(estimatedDate.getDate() + daysLeft)

  return {
    id,
    merchant_name: name,
    rut,
    status: STATUS_BY_STEP[currentStep - 1],
    current_step: currentStep,
    total_steps: 7,
    steps,
    risk_score: riskScore,
    estimated_completion: estimatedDate.toISOString().split('T')[0],
    assigned_to: assignedTo,
  }
}

/**
 * Retorna todos los procesos de onboarding activos
 */
export function getOnboardingProcesses(): OnboardingProcess[] {
  return processes
}

/**
 * Crea un nuevo proceso de onboarding
 */
export function createOnboarding(merchant: { name: string; rut: string; assigned_to: string }): OnboardingProcess {
  const id = `ONB-${String(processes.length + 1).padStart(3, '0')}`
  const newProcess = createProcess(id, merchant.name, merchant.rut, 1, merchant.assigned_to, Math.floor(Math.random() * 50) + 20)
  processes.push(newProcess)
  return newProcess
}

/**
 * Avanza el onboarding al siguiente paso
 */
export function advanceOnboarding(id: string): OnboardingProcess | null {
  const process = processes.find(p => p.id === id)
  if (!process) return null
  if (process.current_step >= process.total_steps) return process

  // Complete current step
  const currentStepObj = process.steps[process.current_step - 1]
  currentStepObj.status = 'completed'
  currentStepObj.completed_docs = ONBOARDING_STEPS[process.current_step - 1].required_docs
  currentStepObj.notes = `Completado el ${new Date().toLocaleDateString('es-CL')}`

  // Move to next step
  process.current_step++
  process.status = STATUS_BY_STEP[process.current_step - 1]
  process.steps[process.current_step - 1].status = 'in_progress'

  return process
}

/**
 * Obtiene un proceso de onboarding por ID
 */
export function getOnboardingById(id: string): OnboardingProcess | null {
  return processes.find(p => p.id === id) || null
}
