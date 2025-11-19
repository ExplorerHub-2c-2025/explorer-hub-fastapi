/**
 * EJEMPLOS DE USO DEL SISTEMA DE PRECIOS FLEXIBLE
 * 
 * Este archivo muestra cómo implementar formularios de reserva
 * para diferentes tipos de negocios usando el nuevo sistema de pricing
 */

import { useState } from "react"

// ============================================
// EJEMPLO 1: MUSEO (Ticket Pricing)
// ============================================
export function MuseumBookingForm({ business }) {
  const [adults, setAdults] = useState(0)
  const [seniors, setSeniors] = useState(0)
  const [children, setChildren] = useState(0)
  const [price, setPrice] = useState(null)

  const calculatePrice = async () => {
    const response = await fetch(`/api/businesses/${business.id}/calculate-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_details: {
          adult_count: adults,
          senior_count: seniors,
          child_count: children
        }
      })
    })
    const data = await response.json()
    setPrice(data)
  }

  return (
    <div>
      <h3>Entradas para {business.name}</h3>
      
      <div>
        <label>Adultos (${business.ticket_pricing.adult_price} c/u)</label>
        <input 
          type="number" 
          min="0" 
          value={adults}
          onChange={(e) => setAdults(parseInt(e.target.value))}
        />
      </div>

      <div>
        <label>Adultos Mayores (${business.ticket_pricing.senior_price} c/u)</label>
        <input 
          type="number" 
          min="0" 
          value={seniors}
          onChange={(e) => setSeniors(parseInt(e.target.value))}
        />
      </div>

      <div>
        <label>Niños (${business.ticket_pricing.child_price} c/u)</label>
        <input 
          type="number" 
          min="0" 
          value={children}
          onChange={(e) => setChildren(parseInt(e.target.value))}
        />
      </div>

      <button onClick={calculatePrice}>Calcular Precio</button>

      {price && (
        <div className="price-summary">
          <p>Precio Original: ${price.original_price}</p>
          {price.discount_amount > 0 && (
            <p>Descuento: -${price.discount_amount}</p>
          )}
          <p className="total">Total a Pagar: ${price.final_price}</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// EJEMPLO 2: HOTEL (Hotel Pricing)
// ============================================
export function HotelBookingForm({ business }) {
  const [nights, setNights] = useState(business.hotel_pricing.min_nights || 1)
  const [price, setPrice] = useState(null)

  const calculatePrice = async () => {
    const response = await fetch(`/api/businesses/${business.id}/calculate-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_details: {
          nights: nights
        }
      })
    })
    const data = await response.json()
    setPrice(data)
  }

  return (
    <div>
      <h3>Reserva en {business.name}</h3>
      
      <div>
        <label>Número de Noches</label>
        <input 
          type="number" 
          min={business.hotel_pricing.min_nights}
          max={business.hotel_pricing.max_nights}
          value={nights}
          onChange={(e) => setNights(parseInt(e.target.value))}
        />
        <p className="info">
          Precio por noche: ${business.hotel_pricing.price_per_night}
        </p>
        {business.hotel_pricing.min_nights > 1 && (
          <p className="warning">Mínimo {business.hotel_pricing.min_nights} noches</p>
        )}
      </div>

      <button onClick={calculatePrice}>Calcular Precio</button>

      {price && (
        <div className="price-summary">
          <p>{nights} noches × ${price.breakdown.price_per_night}</p>
          <p className="total">Total: ${price.final_price}</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// EJEMPLO 3: RESTAURANTE (Restaurant Pricing)
// ============================================
export function RestaurantBookingForm({ business }) {
  const [people, setPeople] = useState(2)
  const [price, setPrice] = useState(null)

  const calculatePrice = async () => {
    const response = await fetch(`/api/businesses/${business.id}/calculate-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_details: {
          people: people
        }
      })
    })
    const data = await response.json()
    setPrice(data)
  }

  return (
    <div>
      <h3>Reserva en {business.name}</h3>
      
      <div>
        <label>Número de Personas</label>
        <input 
          type="number" 
          min="1" 
          value={people}
          onChange={(e) => setPeople(parseInt(e.target.value))}
        />
      </div>

      <button onClick={calculatePrice}>Ver Precio</button>

      {price && (
        <div className="price-summary">
          {business.restaurant_pricing.reservation_fee > 0 && (
            <p>Cargo de reserva: ${price.breakdown.reservation_fee}</p>
          )}
          <p>Consumo estimado: ${price.breakdown.estimated_consumption}</p>
          <p className="total">Total estimado: ${price.breakdown.estimated_total}</p>
          
          {price.warnings?.map((warning, i) => (
            <p key={i} className="warning">{warning}</p>
          ))}
          
          <p className="info">
            Solo se cobrará ${price.final_price} por adelantado (cargo de reserva).
            El resto se paga al consumir.
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================
// EJEMPLO 4: TOUR (Activity Pricing)
// ============================================
export function TourBookingForm({ business }) {
  const [people, setPeople] = useState(1)
  const [price, setPrice] = useState(null)

  const calculatePrice = async () => {
    const response = await fetch(`/api/businesses/${business.id}/calculate-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_details: {
          people: people
        }
      })
    })
    const data = await response.json()
    setPrice(data)
  }

  const hasGroupDiscount = business.activity_pricing.group_discount_threshold &&
                          people >= business.activity_pricing.group_discount_threshold

  return (
    <div>
      <h3>{business.name}</h3>
      
      <div>
        <label>Número de Personas</label>
        <input 
          type="number" 
          min="1" 
          value={people}
          onChange={(e) => setPeople(parseInt(e.target.value))}
        />
        <p className="info">
          Precio por persona: ${business.activity_pricing.base_price}
        </p>
        
        {business.activity_pricing.group_discount_threshold && (
          <p className={hasGroupDiscount ? "success" : "info"}>
            {hasGroupDiscount ? "✨ " : ""}
            Descuento grupal {business.activity_pricing.group_discount_percentage}% 
            a partir de {business.activity_pricing.group_discount_threshold} personas
          </p>
        )}
      </div>

      <button onClick={calculatePrice}>Calcular Precio</button>

      {price && (
        <div className="price-summary">
          <p>{people} personas × ${price.breakdown.base_price}</p>
          <p>Subtotal: ${price.breakdown.subtotal}</p>
          
          {price.breakdown.group_discount_applied && (
            <p className="discount">
              Descuento grupal: -${price.breakdown.group_discount_amount}
            </p>
          )}
          
          <p className="total">Total: ${price.final_price}</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// EJEMPLO 5: SPA (Wellness Pricing)
// ============================================
export function SpaBookingForm({ business }) {
  const [bookingType, setBookingType] = useState('single')
  const [sessions, setSessions] = useState(1)
  const [price, setPrice] = useState(null)

  const calculatePrice = async () => {
    const response = await fetch(`/api/businesses/${business.id}/calculate-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_details: {
          booking_type: bookingType,
          sessions: sessions
        }
      })
    })
    const data = await response.json()
    setPrice(data)
  }

  const packageSavings = business.wellness_pricing.package_price && 
    business.wellness_pricing.sessions_in_package &&
    (business.wellness_pricing.session_price * business.wellness_pricing.sessions_in_package - 
     business.wellness_pricing.package_price)

  return (
    <div>
      <h3>{business.name}</h3>
      
      <div>
        <label>Tipo de Reserva</label>
        <select value={bookingType} onChange={(e) => setBookingType(e.target.value)}>
          <option value="single">
            Sesión Individual - ${business.wellness_pricing.session_price}
          </option>
          {business.wellness_pricing.package_price && (
            <option value="package">
              Paquete {business.wellness_pricing.sessions_in_package} sesiones - 
              ${business.wellness_pricing.package_price}
              {packageSavings > 0 && ` (Ahorras $${packageSavings.toFixed(2)})`}
            </option>
          )}
        </select>
      </div>

      {bookingType === 'single' && (
        <div>
          <label>Número de Sesiones</label>
          <input 
            type="number" 
            min="1" 
            value={sessions}
            onChange={(e) => setSessions(parseInt(e.target.value))}
          />
        </div>
      )}

      <button onClick={calculatePrice}>Calcular Precio</button>

      {price && (
        <div className="price-summary">
          {price.breakdown.booking_type === 'package' ? (
            <>
              <p>Paquete de {price.breakdown.sessions_included} sesiones</p>
              <p>Precio por sesión: ${price.breakdown.price_per_session.toFixed(2)}</p>
              <p className="success">Ahorras: ${price.breakdown.savings}</p>
            </>
          ) : (
            <>
              <p>{price.breakdown.sessions} sesión(es) × ${price.breakdown.price_per_session}</p>
            </>
          )}
          <p className="total">Total: ${price.final_price}</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// EJEMPLO 6: CINE (Entertainment Pricing)
// ============================================
export function CinemaBookingForm({ business }) {
  const [ticketType, setTicketType] = useState('general')
  const [quantity, setQuantity] = useState(1)
  const [isStudent, setIsStudent] = useState(false)
  const [price, setPrice] = useState(null)

  const calculatePrice = async () => {
    const response = await fetch(`/api/businesses/${business.id}/calculate-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_details: {
          ticket_type: ticketType,
          quantity: quantity,
          is_student: isStudent
        }
      })
    })
    const data = await response.json()
    setPrice(data)
  }

  return (
    <div>
      <h3>{business.name}</h3>
      
      <div>
        <label>Tipo de Entrada</label>
        <select value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
          <option value="general">
            General - ${business.entertainment_pricing.general_admission}
          </option>
          {business.entertainment_pricing.vip_admission && (
            <option value="vip">
              VIP - ${business.entertainment_pricing.vip_admission}
            </option>
          )}
        </select>
      </div>

      <div>
        <label>Cantidad</label>
        <input 
          type="number" 
          min="1" 
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
        />
      </div>

      {business.entertainment_pricing.student_discount_percentage > 0 && (
        <div>
          <label>
            <input 
              type="checkbox" 
              checked={isStudent}
              onChange={(e) => setIsStudent(e.target.checked)}
            />
            Soy estudiante ({business.entertainment_pricing.student_discount_percentage}% descuento)
          </label>
        </div>
      )}

      <button onClick={calculatePrice}>Calcular Precio</button>

      {price && (
        <div className="price-summary">
          <p>{quantity} entrada(s) {price.breakdown.ticket_type}</p>
          <p>Subtotal: ${price.breakdown.subtotal}</p>
          
          {price.breakdown.student_discount_applied && (
            <p className="discount">
              Descuento estudiante: -${price.breakdown.student_discount_amount}
            </p>
          )}
          
          <p className="total">Total: ${price.final_price}</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// COMPONENTE UNIVERSAL
// ============================================
export function UniversalBookingForm({ business }) {
  const categories = business.categories || []
  
  // Determinar qué componente mostrar
  if (categories.includes("Alojamiento") && business.hotel_pricing) {
    return <HotelBookingForm business={business} />
  }
  
  if ((categories.includes("Restaurante") || categories.includes("Vida Nocturna")) && 
      business.restaurant_pricing) {
    return <RestaurantBookingForm business={business} />
  }
  
  if (categories.includes("Bienestar") && business.wellness_pricing) {
    return <SpaBookingForm business={business} />
  }
  
  if (categories.includes("Entretenimiento") && business.entertainment_pricing) {
    return <CinemaBookingForm business={business} />
  }
  
  if (categories.includes("Actividad") && business.activity_pricing) {
    return <TourBookingForm business={business} />
  }
  
  if (business.ticket_pricing) {
    return <MuseumBookingForm business={business} />
  }
  
  return <div>Este negocio no tiene precios configurados</div>
}
