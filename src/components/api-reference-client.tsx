'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Code2, ChevronRight, Zap, Layers, Wallet, ShieldAlert, Bell, Scale } from 'lucide-react'

interface ApiEndpoint {
  method: 'POST' | 'GET'
  path: string
  title: string
  description: string
  engine: string
  icon: React.ElementType
  iconColor: string
  requestBody?: string
  responseExample?: string
}

const ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'POST',
    path: '/api/authorize',
    title: 'Authorization Engine',
    description: 'Procesa una solicitud de autorización contra el motor de reglas KLAP. Evalúa BIN, límites, riesgo y persiste el resultado.',
    engine: 'authorization.ts',
    icon: Zap,
    iconColor: 'text-amber-400',
    requestBody: `{
  "merchant_id": "uuid",
  "amount": 45230,
  "currency": "CLP",
  "card_brand": "visa",
  "card_type": "credit",
  "card_last_four": "4521",
  "payment_method": "contactless",
  "installments": 1
}`,
    responseExample: `{
  "authorization": {
    "approved": true,
    "auth_code": "K3X9F2",
    "reference_id": "KLP-M1A2B3-X7Y8Z9",
    "risk_score": 12,
    "processing_time_ms": 0.45,
    "rules_evaluated": [...]
  }
}`,
  },
  {
    method: 'POST',
    path: '/api/fraud/check',
    title: 'Fraud Detection Engine',
    description: 'Ejecuta análisis antifraude con 8 checks: velocity, geolocation, device fingerprint, ML model, patrones de cuotas, etc.',
    engine: 'fraud.ts',
    icon: ShieldAlert,
    iconColor: 'text-rose-400',
    requestBody: `{
  "transaction_id": "txn_id",
  "amount": 450000,
  "card_brand": "visa",
  "card_type": "credit",
  "card_last_four": "4521",
  "payment_method": "ecommerce",
  "merchant_id": "uuid",
  "merchant_category": "electronics",
  "installments": 12,
  "geolocation": { "country": "CL", "city": "Santiago" }
}`,
    responseExample: `{
  "fraud_score": 28,
  "decision": "approve",
  "risk_level": "medium",
  "ml_model_version": "FraudNet-KLAP-v2.4.1",
  "checks_performed": [...],
  "recommendations": [...]
}`,
  },
  {
    method: 'POST',
    path: '/api/clearing/generate',
    title: 'Clearing Engine',
    description: 'Genera archivos de clearing CTF (Visa) o IPM (Mastercard) a partir de transacciones liquidadas. Calcula checksum y registra batch.',
    engine: 'clearing.ts',
    icon: Layers,
    iconColor: 'text-blue-400',
    requestBody: `{
  "brand": "visa" | "mastercard"
}`,
    responseExample: `{
  "batch": { "batch_number": "VISA-20250615-001", ... },
  "file_name": "CTF_VISA_20250615_001.dat",
  "checksum": "A3F2B1C0",
  "transaction_count": 45,
  "total_amount": 12500000
}`,
  },
  {
    method: 'POST',
    path: '/api/settlement/calculate',
    title: 'Settlement Engine',
    description: 'Calcula la liquidación de un comercio aplicando fee_rules, IVA (19%) y retenciones. Genera desglose por marca/tipo/método.',
    engine: 'settlement.ts',
    icon: Wallet,
    iconColor: 'text-emerald-400',
    requestBody: `{
  "merchant_id": "uuid"
}`,
    responseExample: `{
  "settlement": {
    "gross_amount": 2450000,
    "commission": 53900,
    "iva": 10241,
    "withholdings": 12250,
    "net_amount": 2373609
  },
  "breakdown": [...],
  "processing_details": [...]
}`,
  },
  {
    method: 'POST',
    path: '/api/webhooks/send',
    title: 'Webhook Engine',
    description: 'Envía notificaciones webhook a comercios para eventos del sistema. Soporta retry logic y tracking de delivery.',
    engine: 'webhooks.ts',
    icon: Bell,
    iconColor: 'text-sky-400',
    requestBody: `{
  "event_type": "transaction.authorized",
  "merchant_id": "uuid"
}`,
    responseExample: `{
  "id": "whk_m1a2b3_x7y8z9",
  "status": "delivered",
  "response_code": 200,
  "response_time_ms": 145,
  "endpoint_url": "https://api.merchant.cl/klap/webhooks"
}`,
  },
  {
    method: 'POST',
    path: '/api/simulate',
    title: 'Transaction Simulator',
    description: 'Genera una transacción random con datos realistas y la inserta en la base de datos. Útil para demo y testing.',
    engine: 'simulate',
    icon: Scale,
    iconColor: 'text-violet-400',
    requestBody: `// No body required`,
    responseExample: `{
  "success": true,
  "transaction": {
    "id": "uuid",
    "amount": 78500,
    "card_brand": "mastercard",
    "status": "authorized"
  }
}`,
  },
]

export function ApiReferenceClient() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="API Reference"
        description="Endpoints del Payment Operating System KLAP — todos funcionales"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">{ENDPOINTS.length} endpoints activos</span>
        </div>
      </PageHeader>

      {/* Architecture note */}
      <Card className="border-accent/20 bg-accent/[0.02]">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Code2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Arquitectura de Microservicios</p>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Cada endpoint ejecuta un engine independiente con su propia lógica de negocio.
              En producción, cada engine se despliega como un servicio independiente con su propia base de datos y scaling.
              Esto es exactamente lo que BPC SmartVista hace como monolito — pero modular y cloud-native.
            </p>
          </div>
        </div>
      </Card>

      {/* Endpoints */}
      <div className="space-y-3">
        {ENDPOINTS.map((endpoint) => {
          const isExpanded = expanded === endpoint.path
          const Icon = endpoint.icon

          return (
            <Card
              key={endpoint.path}
              className={cn('cursor-pointer transition-all', isExpanded && 'border-accent/30')}
              onClick={() => setExpanded(isExpanded ? null : endpoint.path)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-card-hover flex items-center justify-center flex-shrink-0">
                  <Icon className={cn('w-5 h-5', endpoint.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" className="font-mono text-[10px]">
                      {endpoint.method}
                    </Badge>
                    <span className="font-mono text-sm text-accent">{endpoint.path}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{endpoint.title}</p>
                </div>
                <ChevronRight className={cn(
                  'w-4 h-4 text-muted transition-transform',
                  isExpanded && 'rotate-90'
                )} />
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border space-y-4 animate-fade-in" onClick={e => e.stopPropagation()}>
                  <p className="text-sm text-foreground/80">{endpoint.description}</p>
                  <div className="text-[10px] text-muted font-mono">Engine: src/lib/engines/{endpoint.engine}</div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted mb-2 font-medium">Request Body</p>
                      <pre className="text-[11px] font-mono text-muted bg-background border border-border rounded-lg p-3 overflow-x-auto leading-relaxed">
                        {endpoint.requestBody}
                      </pre>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted mb-2 font-medium">Response</p>
                      <pre className="text-[11px] font-mono text-muted bg-background border border-border rounded-lg p-3 overflow-x-auto leading-relaxed">
                        {endpoint.responseExample}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
