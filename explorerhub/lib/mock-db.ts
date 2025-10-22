interface MockUser {
  id: string
  email: string
  password: string
  full_name: string
  is_business: boolean
  country?: string
  date_of_birth?: string
  preferences?: string[]
  language?: string
  business_type?: string
  phone?: string
  address?: string
  description?: string
  price_range?: string
  tax_number?: string
  created_at?: string
}

// Shared mock users array
export const mockUsers: MockUser[] = [
  {
    id: "1",
    email: "viajero@test.com",
    password: "password123",
    full_name: "Juan Viajero",
    is_business: false,
    country: "Argentina",
    date_of_birth: "1990-01-01",
    preferences: ["adventure", "culture"],
    language: "es",
  },
  {
    id: "2",
    email: "negocio@test.com",
    password: "password123",
    full_name: "Hotel Paradise",
    is_business: true,
    business_type: "hotel",
    phone: "+54 11 1234-5678",
    address: "Av. Corrientes 1234, Buenos Aires",
  },
]
