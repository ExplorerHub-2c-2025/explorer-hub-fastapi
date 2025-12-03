'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle, Calendar, Users, Clock, Tag } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BookingWithUser {
  id: number;
  business_id: number;
  user_id: string;
  user_name: string;
  user_email: string;
  name: string; // Nombre de la actividad/reserva
  amount: number; // Cantidad de personas
  date: string;
  time: string;
  promotion_code?: string;
  discount_applied?: number;
  original_price?: number;
  final_price?: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

interface Business {
  id: number;
  name: string;
}

export default function BusinessBookings() {
  const [bookings, setBookings] = useState<BookingWithUser[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/sign-in');
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'business') {
      router.push('/explore');
      return;
    }
    setUser(parsedUser);
    fetchBusinesses();
  }, [router]);

  useEffect(() => {
    if (selectedBusinessId) {
      fetchBookings();
    }
  }, [selectedBusinessId]);

  const fetchBusinesses = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/sign-in');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://localhost:8000'}/api/businesses/owner/my-businesses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/sign-in');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setBusinesses(data);
        if (data.length > 0) {
          setSelectedBusinessId(data[0].id);
        }
      } else {
        setError('Error al cargar los negocios');
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError('Error al cargar los negocios');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/sign-in');
        return;
      }

      const response = await fetch(`/api/bookings/business/${selectedBusinessId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener las reservas');
      }

      const data = await response.json();
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Error al cargar las reservas');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmBooking = async (bookingId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/sign-in');
        return;
      }

      const response = await fetch(`/api/bookings/${bookingId}/confirm`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al confirmar la reserva');
      }

      // Refresh bookings
      await fetchBookings();
    } catch (err) {
      console.error('Error confirming booking:', err);
      alert(err instanceof Error ? err.message : 'Error al confirmar la reserva');
    }
  };

  const cancelBooking = async (bookingId: number) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/sign-in');
        return;
      }

      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cancelar la reserva');
      }

      // Refresh bookings
      await fetchBookings();
    } catch (err) {
      console.error('Error canceling booking:', err);
      alert(err instanceof Error ? err.message : 'Error al cancelar la reserva');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  const displayedBookings = selectedStatus === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === selectedStatus);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestión de Reservas</h1>
          <p className="text-muted-foreground">Administra las reservas de tus clientes</p>
        </div>

        {/* Business Selector & Stats Grid */}
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
          {/* Business Selector Card - Left Side (40% width) */}
          <Card className="w-full md:w-[40%] bg-white shadow-md rounded-xl hover:shadow-lg transition-shadow border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Seleccionar Negocio</CardTitle>
              <CardDescription className="text-sm">Elige el negocio para ver sus reservas</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedBusinessId?.toString()}
                onValueChange={(value) => setSelectedBusinessId(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un negocio" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id.toString()}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Stats Mini-Cards - Right Side (60% width) */}
          {selectedBusinessId && (
            <div className="w-full md:w-[60%] flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Card 1: Reservas Confirmadas */}
              <Card 
                className={`flex-1 aspect-square max-h-36 shadow-md rounded-xl transition-all cursor-pointer flex items-center justify-center p-4 ${
                  selectedStatus === 'confirmed' 
                    ? 'border-2 border-green-500 bg-green-50 shadow-xl scale-105' 
                    : 'border border-gray-200 bg-white hover:shadow-lg hover:scale-102'
                }`}
                onClick={() => setSelectedStatus(selectedStatus === 'confirmed' ? 'all' : 'confirmed')}
              >
                <div className="flex flex-col items-center justify-center space-y-2 w-full text-center">
                  <div className={`rounded-full p-2 transition-colors ${
                    selectedStatus === 'confirmed' ? 'bg-green-500' : 'bg-green-500/10'
                  }`}>
                    <CheckCircle className={`h-5 w-5 transition-colors ${
                      selectedStatus === 'confirmed' ? 'text-white' : 'text-green-500'
                    }`} />
                  </div>
                  <p className={`text-sm font-medium transition-colors ${
                    selectedStatus === 'confirmed' ? 'text-green-800' : 'text-gray-500'
                  }`}>
                    Confirmadas
                  </p>
                  <p className={`text-2xl font-bold transition-colors ${
                    selectedStatus === 'confirmed' ? 'text-green-700' : 'text-green-500'
                  }`}>
                    {confirmedBookings.length}
                  </p>
                </div>
              </Card>

              {/* Card 2: Reservas Pendientes */}
              <Card 
                className={`flex-1 aspect-square max-h-36 shadow-md rounded-xl transition-all cursor-pointer flex items-center justify-center p-4 ${
                  selectedStatus === 'pending' 
                    ? 'border-2 border-yellow-500 bg-yellow-50 shadow-xl scale-105' 
                    : 'border border-gray-200 bg-white hover:shadow-lg hover:scale-102'
                }`}
                onClick={() => setSelectedStatus(selectedStatus === 'pending' ? 'all' : 'pending')}
              >
                <div className="flex flex-col items-center justify-center space-y-2 w-full text-center">
                  <div className={`rounded-full p-2 transition-colors ${
                    selectedStatus === 'pending' ? 'bg-yellow-500' : 'bg-yellow-500/10'
                  }`}>
                    <Clock className={`h-5 w-5 transition-colors ${
                      selectedStatus === 'pending' ? 'text-white' : 'text-yellow-600'
                    }`} />
                  </div>
                  <p className={`text-sm font-medium transition-colors ${
                    selectedStatus === 'pending' ? 'text-yellow-800' : 'text-gray-500'
                  }`}>
                    Pendientes
                  </p>
                  <p className={`text-2xl font-bold transition-colors ${
                    selectedStatus === 'pending' ? 'text-yellow-700' : 'text-yellow-600'
                  }`}>
                    {pendingBookings.length}
                  </p>
                </div>
              </Card>

              {/* Card 3: Reservas Canceladas */}
              <Card 
                className={`flex-1 aspect-square max-h-36 shadow-md rounded-xl transition-all cursor-pointer flex items-center justify-center p-4 ${
                  selectedStatus === 'cancelled' 
                    ? 'border-2 border-red-500 bg-red-50 shadow-xl scale-105' 
                    : 'border border-gray-200 bg-white hover:shadow-lg hover:scale-102'
                }`}
                onClick={() => setSelectedStatus(selectedStatus === 'cancelled' ? 'all' : 'cancelled')}
              >
                <div className="flex flex-col items-center justify-center space-y-2 w-full text-center">
                  <div className={`rounded-full p-2 transition-colors ${
                    selectedStatus === 'cancelled' ? 'bg-red-500' : 'bg-red-500/10'
                  }`}>
                    <XCircle className={`h-5 w-5 transition-colors ${
                      selectedStatus === 'cancelled' ? 'text-white' : 'text-red-500'
                    }`} />
                  </div>
                  <p className={`text-sm font-medium transition-colors ${
                    selectedStatus === 'cancelled' ? 'text-red-800' : 'text-gray-500'
                  }`}>
                    Canceladas
                  </p>
                  <p className={`text-2xl font-bold transition-colors ${
                    selectedStatus === 'cancelled' ? 'text-red-700' : 'text-red-500'
                  }`}>
                    {cancelledBookings.length}
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Bookings Section */}
        {selectedBusinessId && (
          <div className="mb-8 bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {selectedStatus === 'all' ? 'Todas las Reservas' :
                 selectedStatus === 'pending' ? 'Reservas Pendientes' :
                 selectedStatus === 'confirmed' ? 'Reservas Confirmadas' :
                 'Reservas Canceladas'}
              </h2>
              {selectedStatus !== 'all' && (
                <Button variant="outline" size="sm" onClick={() => setSelectedStatus('all')}>
                  Ver todas
                </Button>
              )}
            </div>

            {displayedBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay reservas</h3>
                <p className="text-muted-foreground">
                  {selectedStatus === 'all' 
                    ? 'No hay reservas para este negocio' 
                    : `No hay reservas ${selectedStatus === 'pending' ? 'pendientes' : selectedStatus === 'confirmed' ? 'confirmadas' : 'canceladas'}`
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                {displayedBookings.map((booking) => (
                  <Card key={booking.id} className="border hover:border-primary/30 transition-all flex flex-col">
                    <CardHeader className="pb-2 px-3 pt-3">
                      <div className="flex justify-between items-start gap-1 mb-1">
                        <CardTitle className="text-sm font-semibold line-clamp-2 leading-tight">{booking.name}</CardTitle>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium whitespace-nowrap w-fit ${
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.status === 'pending' ? 'Pendiente' :
                         booking.status === 'confirmed' ? 'Confirmada' :
                         'Cancelada'}
                      </span>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3 px-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2 text-[11px] mb-2">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-2.5 w-2.5 flex-shrink-0" />
                          <span className="truncate text-[10px]">{new Date(booking.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                          <Clock className="h-2.5 w-2.5 flex-shrink-0 ml-1" />
                          <span className="text-[10px]">{booking.time}</span>
                        </div>
                        
                        <div className="pt-1 border-t">
                          <div className="flex items-center gap-1 mb-1">
                            <Users className="h-2.5 w-2.5 flex-shrink-0 text-muted-foreground" />
                            <p className="font-medium truncate text-[10px]">{booking.user_name}</p>
                          </div>
                          <p className="text-muted-foreground truncate text-[9px] pl-3.5">{booking.user_email}</p>
                          <p className="text-muted-foreground text-[10px] pl-3.5">{booking.amount} personas</p>
                        </div>
                      </div>

                      {/* Acciones */}
                      {booking.status === 'pending' && (
                        <div className="flex flex-col gap-1.5 pt-2 border-t">
                          <Button
                            onClick={() => confirmBooking(booking.id)}
                            size="sm"
                            className="w-full h-7 text-[10px] px-2"
                          >
                            <CheckCircle className="h-2.5 w-2.5 mr-1" />
                            Confirmar
                          </Button>
                          <Button
                            onClick={() => cancelBooking(booking.id)}
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-[10px] px-2 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                          >
                            <XCircle className="h-2.5 w-2.5 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State - No business */}
        {!selectedBusinessId && !isLoading && (
          <Card className="bg-white shadow-md rounded-xl border-0">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay negocios registrados</h3>
              <p className="text-muted-foreground mb-6 text-center">
                Necesitas registrar un negocio para ver las reservas
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
