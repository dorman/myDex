import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, Star, Trash2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'

interface UserFavorite {
  id: string
  symbol: string
  name: string
  assetType: string
  metadata?: {
    icon?: string
    [key: string]: any
  } | null
  createdAt: Date
}

interface UserFavoritesProps {
  onAddToPortfolio?: (favorite: UserFavorite) => void
}

export const UserFavorites: React.FC<UserFavoritesProps> = ({ onAddToPortfolio }) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const { data: favorites, isLoading } = useQuery({
    queryKey: ['user-favorites'],
    queryFn: async () => {
      const response = await api.getUserFavorites()
      return response
    },
  })

  const deleteFavoriteMutation = useMutation({
    mutationFn: (id: string) => api.deleteUserFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] })
      toast({
        title: 'Success',
        description: 'Asset removed from favorites',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove asset from favorites',
        variant: 'destructive',
      })
    },
  })

  const handleRemoveFavorite = (id: string) => {
    deleteFavoriteMutation.mutate(id)
  }

  const handleAddToPortfolio = (favorite: UserFavorite) => {
    onAddToPortfolio?.(favorite)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Your Favorites
          </CardTitle>
          <CardDescription>Loading your favorite assets...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Your Favorites
        </CardTitle>
        <CardDescription>
          {favorites?.length ? `${favorites.length} favorite assets` : 'No favorite assets yet'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!favorites?.length ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No favorite assets yet</p>
            <p className="text-sm text-muted-foreground">
              Add assets to your favorites to quickly access them later
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {favorite.metadata?.icon ? (
                      <span className="text-sm">{favorite.metadata.icon}</span>
                    ) : (
                      <span className="text-sm font-medium">
                        {favorite.symbol.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{favorite.symbol}</span>
                      <Badge variant="secondary" className="text-xs">
                        {favorite.assetType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {favorite.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onAddToPortfolio && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddToPortfolio(favorite)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveFavorite(favorite.id)}
                    disabled={deleteFavoriteMutation.isPending}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
