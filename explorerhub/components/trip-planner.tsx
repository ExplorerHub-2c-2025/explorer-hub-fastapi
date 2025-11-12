"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import styles from "./trip-planner.module.css"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Sparkles, Globe, Lock, Users } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface TripPlannerProps {
  onCreateTrip: (data: any) => void
}

export function TripPlanner({ onCreateTrip }: TripPlannerProps) {
  const [name, setName] = useState("")
  const [destination, setDestination] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"private" | "followers" | "public">("private")
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date)
    setIsStartDateOpen(false)
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date)
    setIsEndDateOpen(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateTrip({
      name,
      destination,
      start_date: startDate ? startDate.toISOString() : null,
      end_date: endDate ? endDate.toISOString() : null,
      description,
      visibility,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={styles.cardTitle}>
          <Sparkles className={styles.titleIcon} />
          Arma tu viaje
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.fieldContainer}>
            <Label htmlFor="name" className={styles.labelMargin}>Nombre del viaje *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Verano en Italia"
              required
            />
          </div>

          <div className={styles.fieldContainer}>
            <Label htmlFor="destination" className={styles.labelMargin}>Destino *</Label>
            <Input
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Roma, Florencia, Venecia"
              required
            />
          </div>

          <div className={styles.gridTwo}>
            <div className={styles.fieldContainer}>
              <Label>Fecha de inicio *</Label>
              <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={styles.calendarButton}>
                    <CalendarIcon className={styles.calendarIcon} />
                    {startDate ? format(startDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={styles.popoverContent}>
                  <Calendar mode="single" selected={startDate} onSelect={handleStartDateSelect} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className={styles.fieldContainer}>
              <Label>Fecha de fin *</Label>
              <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={styles.calendarButton}>
                    <CalendarIcon className={styles.calendarIcon} />
                    {endDate ? format(endDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={styles.popoverContent}>
                  <Calendar mode="single" selected={endDate} onSelect={handleEndDateSelect} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className={styles.fieldContainer}>
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Añade notas sobre tu viaje..."
            />
          </div>

          <div className={styles.fieldContainer}>
            <Label>Visibilidad del itinerario</Label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              <Button
                type="button"
                variant={visibility === "private" ? "default" : "outline"}
                onClick={() => setVisibility("private")}
                className="justify-start h-auto p-3"
              >
                <Lock className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Privado</div>
                  <div className="text-xs opacity-70">Solo tú puedes ver este itinerario</div>
                </div>
              </Button>
              
              <Button
                type="button"
                variant={visibility === "followers" ? "default" : "outline"}
                onClick={() => setVisibility("followers")}
                className="justify-start h-auto p-3"
              >
                <Users className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Solo seguidores</div>
                  <div className="text-xs opacity-70">Visible para ti y tus seguidores</div>
                </div>
              </Button>
              
              <Button
                type="button"
                variant={visibility === "public" ? "default" : "outline"}
                onClick={() => setVisibility("public")}
                className="justify-start h-auto p-3"
              >
                <Globe className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Público</div>
                  <div className="text-xs opacity-70">Visible para todos los usuarios</div>
                </div>
              </Button>
            </div>
          </div>

          <Button type="submit" className={styles.fullWidthBtn} disabled={!name || !destination || !startDate || !endDate}>
            Crear Viaje
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
