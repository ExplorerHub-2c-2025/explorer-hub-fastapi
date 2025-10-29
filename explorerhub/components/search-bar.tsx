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
          <MapPin className={styles.icon} />
          <Input
            type="text"
            placeholder="Where to?"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <Search className={styles.icon} />
          <Input
            type="text"
            placeholder="Restaurants, activities, experiences..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.input}
          />
        </div>

        <Button size="lg" className={styles.button}>
          Search
        </Button>
      </div>
    </div>
  )
}
