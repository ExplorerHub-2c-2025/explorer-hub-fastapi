"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import styles from "./trip-planner.module.css"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Sparkles } from "lucide-react"
import { format } from "date-fns"

interface TripPlannerProps {
  onCreateTrip: (data: any) => void
}

export function TripPlanner({ onCreateTrip }: TripPlannerProps) {
  const [name, setName] = useState("")
  const [destination, setDestination] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [description, setDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateTrip({
      name,
      destination,
      start_date: startDate,
      end_date: endDate,
      description,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={styles.cardTitle}>
          <Sparkles className={styles.titleIcon} />
          Plan Your Trip
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.spaceY2}>
            <Label htmlFor="name">Trip Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer in Italy"
              required
            />
          </div>

          <div className={styles.spaceY2}>
            <Label htmlFor="destination">Destination *</Label>
            <Input
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g., Rome, Florence, Venice"
              required
            />
          </div>

          <div className={styles.gridTwo}>
            <div className={styles.fieldContainer}>
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={styles.calendarButton}>
                    <CalendarIcon className={styles.calendarIcon} />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={styles.popoverContent}>
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className={styles.fieldContainer}>
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={styles.calendarButton}>
                    <CalendarIcon className={styles.calendarIcon} />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={styles.popoverContent}>
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className={styles.fieldContainer}>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about your trip..."
            />
          </div>

          <Button type="submit" className={styles.fullWidthBtn} disabled={!name || !destination || !startDate || !endDate}>
            Create Trip
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
