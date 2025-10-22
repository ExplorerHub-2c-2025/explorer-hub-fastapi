"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import styles from "./business-form.module.css"

interface BusinessFormProps {
  onSubmit: (data: any) => void
  initialData?: any
  isLoading?: boolean
}

export function BusinessForm({ onSubmit, initialData, isLoading }: BusinessFormProps) {
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      description: "",
      category: "",
      address: "",
      city: "",
      state: "",
      country: "",
      phone: "",
      website: "",
      price_level: 2,
      tags: "",
    },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      ...formData,
      location: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
      },
      tags: formData.tags.split(",").map((tag: string) => tag.trim()),
    }
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? "Edit Business" : "Add New Business"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={styles.gridTwo}>
            <div className={styles.spaceY2}>
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.spaceY2}>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Restaurant">Restaurant</SelectItem>
                  <SelectItem value="Activity">Activity</SelectItem>
                  <SelectItem value="Attraction">Attraction</SelectItem>
                  <SelectItem value="Nature">Nature</SelectItem>
                  <SelectItem value="Cultural">Cultural</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={styles.spaceY2}>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className={styles.gridTwo}>
            <div className={styles.spaceY2}>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className={styles.spaceY2}>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
          </div>

          <div className={styles.gridTwo}>
            <div className={styles.spaceY2}>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
            </div>

            <div className={styles.spaceY2}>
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>
          </div>

          <div className={styles.gridTwo}>
            <div className={styles.spaceY2}>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className={styles.spaceY2}>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.gridTwo}>
            <div className={styles.spaceY2}>
              <Label htmlFor="price_level">Price Level *</Label>
              <Select
                value={formData.price_level.toString()}
                onValueChange={(value) => setFormData({ ...formData, price_level: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">$ - Budget</SelectItem>
                  <SelectItem value="2">$$ - Moderate</SelectItem>
                  <SelectItem value="3">$$$ - Expensive</SelectItem>
                  <SelectItem value="4">$$$$ - Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={styles.spaceY2}>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., Italian, Fine Dining, Romantic"
              />
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : initialData ? "Update Business" : "Create Business"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
