"use client"

import { useState } from "react"
import { Search, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import styles from "./search-bar.module.css"

export function SearchBar() {
  const [location, setLocation] = useState("")
  const [query, setQuery] = useState("")

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.field}>
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Where to?"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <div className={styles.field}>
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Restaurants, activities, experiences..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <Button size="lg" className="md:w-auto">
          Search
        </Button>
      </div>
    </div>
  )
}
