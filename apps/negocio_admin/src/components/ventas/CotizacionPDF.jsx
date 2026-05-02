// ============================================
// Luxury Enterprise Quote Template — VendeMas CRM
// src/components/ventas/CotizacionPDF.jsx
// ============================================
import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Link } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 9,
    color: '#1E293B',
    fontFamily: 'Helvetica',
  },
  // ── HEADER ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 50,
  },
  logoContainer: {
    width: '60%',
  },
  logo: {
    maxHeight: 50,
    maxWidth: 180,
    objectFit: 'contain',
  },
  logoPlaceholder: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  quoteTitleContainer: {
    width: '40%',
    textAlign: 'right',
  },
  quoteTitleLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 4,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  quoteNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  quoteDate: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 3,
  },

  // ── DIVIDER ──
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginVertical: 20,
  },

  // ── CLIENT SECTION ──
  clientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  clientCol: {
    width: '48%',
  },
  sectionLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  clientName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 5,
  },
  clientInfo: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
  },

  // ── TABLE ──
  table: {
    width: '100%',
    marginBottom: 40,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableHeaderText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  colImg: { width: '8%' },
  colQty: { width: '8%', textAlign: 'center' },
  colDesc: { width: '44%', paddingLeft: 12 },
  colPrice: { width: '15%', textAlign: 'right' },
  colDisc: { width: '10%', textAlign: 'right' },
  colSub: { width: '15%', textAlign: 'right' },
  
  productName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  productSku: {
    fontSize: 8,
    color: '#94A3B8',
  },
  
  // ── TOTALS ──
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsContainer: {
    width: '38%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 9,
    color: '#64748B',
  },
  totalValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1.5,
    borderTopColor: '#0F172A',
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },

  // ── FOOTER ──
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 50,
    right: 50,
    textAlign: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerText: {
    fontSize: 7,
    color: '#94A3B8',
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  techLink: {
    fontSize: 7,
    color: '#6366F1',
    textDecoration: 'underline',
    marginTop: 4,
    marginRight: 8,
  }
})

export default React.memo(function CotizacionPDF({ cotizacion, tenant }) {
  if (!cotizacion) return null;

  const totalFinal = parseFloat(cotizacion.total || 0);
  const subtotal = totalFinal / 1.18;
  const igv = totalFinal - subtotal;
  const currency = cotizacion.moneda === 'USD' ? '$' : 'S/';

  const tieneDescuentos = cotizacion.detalles?.some(item => parseFloat(item.descuento_porcentaje) > 0);
  const contactoB2B = cotizacion.contacto || cotizacion.cliente_contactos;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {tenant.logo_url ? (
              <Image src={tenant.logo_url} style={styles.logo} />
            ) : (
              <Text style={styles.logoPlaceholder}>{tenant.nombre}</Text>
            )}
          </View>
          <View style={styles.quoteTitleContainer}>
            <Text style={styles.quoteTitleLabel}>Cotización</Text>
            <Text style={styles.quoteNumber}>#{cotizacion.correlativo || cotizacion.id.toString().slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.quoteDate}>{new Date(cotizacion.fecha_creacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
          </View>
        </View>

        {/* ── CLIENT & BUSINESS INFO ── */}
        <View style={styles.clientSection}>
          <View style={styles.clientCol}>
            <Text style={styles.sectionLabel}>Preparado para</Text>
            <Text style={styles.clientName}>{cotizacion.cliente?.nombre_razon_social}</Text>
            <Text style={styles.clientInfo}>{cotizacion.cliente?.tipo_documento}: {cotizacion.cliente?.numero_documento}</Text>
            <Text style={styles.clientInfo}>{cotizacion.cliente?.direccion}</Text>
            {contactoB2B && (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.clientInfo, { fontWeight: 'bold', color: '#1E293B' }]}>Atn: {contactoB2B.nombre_completo}</Text>
                <Text style={styles.clientInfo}>{contactoB2B.cargo}</Text>
              </View>
            )}
          </View>

          <View style={[styles.clientCol, { textAlign: 'right' }]}>
            <Text style={styles.sectionLabel}>Emitido por</Text>
            <Text style={styles.clientName}>{tenant.nombre}</Text>
            <Text style={styles.clientInfo}>RUC: {tenant.ruc || 'N/A'}</Text>
            <Text style={styles.clientInfo}>{tenant.correo_ventas}</Text>
            <Text style={styles.clientInfo}>{tenant.telefono}</Text>
          </View>
        </View>

        {/* ── TABLE ── */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colImg}></Text>
            <Text style={styles.colQty}>
              <Text style={styles.tableHeaderText}>Cant</Text>
            </Text>
            <Text style={[styles.colDesc, !tieneDescuentos && { width: '54%' }]}>
              <Text style={styles.tableHeaderText}>Descripción</Text>
            </Text>
            <Text style={styles.colPrice}>
              <Text style={styles.tableHeaderText}>P. Unit</Text>
            </Text>
            {tieneDescuentos && (
              <Text style={styles.colDisc}>
                <Text style={styles.tableHeaderText}>Dcto</Text>
              </Text>
            )}
            <Text style={styles.colSub}>
              <Text style={styles.tableHeaderText}>Total</Text>
            </Text>
          </View>

          {cotizacion.detalles?.map((det, i) => (
            <View key={i} style={styles.tableRow} wrap={false}>
              <View style={styles.colImg}>
                {det.producto?.fotos?.[0] && (
                  <Image src={det.producto.fotos[0]} style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid #F1F5F9' }} />
                )}
              </View>
              <Text style={[styles.colQty, { fontSize: 10, fontWeight: 'bold' }]}>{det.cantidad}</Text>
              <View style={[styles.colDesc, !tieneDescuentos && { width: '54%' }]}>
                <Text style={styles.productName}>{det.producto?.nombre}</Text>
                <Text style={styles.productSku}>SKU: {det.producto?.sku}</Text>
                
                <View style={{ flexDirection: 'row' }}>
                  {det.producto?.url_ficha_tecnica && (
                    <Link src={det.producto.url_ficha_tecnica} style={styles.techLink}>Ficha Técnica</Link>
                  )}
                  {det.producto?.url_certificado_calidad && (
                    <Link src={det.producto.url_certificado_calidad} style={styles.techLink}>Certificación</Link>
                  )}
                </View>
              </View>
              <Text style={styles.colPrice}>{currency}{parseFloat(det.precio_unitario).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              {tieneDescuentos && (
                <Text style={styles.colDisc}>-{currency}{parseFloat(det.descuento_porcentaje || 0).toFixed(2)}</Text>
              )}
              <Text style={[styles.colSub, { fontWeight: 'bold' }]}>{currency}{parseFloat(det.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            </View>
          ))}
        </View>

        {/* ── TOTALS ── */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{currency}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IGV (18%)</Text>
              <Text style={styles.totalValue}>{currency}{igv.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{currency}{totalFinal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            </View>
            
            {cotizacion.tipo_cambio && (
              <View style={{ marginTop: 10, textAlign: 'right' }}>
                <Text style={{ fontSize: 7, color: '#94A3B8', fontStyle: 'italic' }}>
                  {cotizacion.moneda === 'PEN'
                    ? `Ref: $ ${(totalFinal / cotizacion.tipo_cambio).toFixed(2)} (T.C. ${cotizacion.tipo_cambio})`
                    : `Ref: S/ ${(totalFinal * cotizacion.tipo_cambio).toFixed(2)} (T.C. ${cotizacion.tipo_cambio})`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {tenant.sitio_web ? `${tenant.sitio_web}  •  ` : ''}
            {tenant.correo_ventas}  •  
            {tenant.telefono}
          </Text>
          <Text style={[styles.footerText, { color: '#64748B', fontWeight: 'bold' }]}>
            Generado por {cotizacion.agente?.nombre_completo || 'VendeMas CRM'}
          </Text>
        </View>

      </Page>
    </Document>
  )
})
