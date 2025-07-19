"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useCustomTherapy } from "@/components/custom-therapy-provider"
import { Plus, Edit, Trash2, Upload, Download, FileAudio, FileVideo, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CustomTherapyManagerProps {
  selectedTherapy: any | null
  onSelectTherapy: (therapy: any) => void
}

export default function CustomTherapyManager({ selectedTherapy, onSelectTherapy }: CustomTherapyManagerProps) {
  const {
    customTherapies,
    addTherapy,
    updateTherapy,
    deleteTherapy,
    exportTherapies,
    importTherapies,
    clearAllTherapies,
    isLoaded,
  } = useCustomTherapy()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTherapy, setEditingTherapy] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#10B981",
    frequency: "custom",
    icon: "🎵",
    hasVideo: false,
    hasAudio: true,
  })
  const [audioFiles, setAudioFiles] = useState<{ [key: string]: File }>({})
  const [videoFiles, setVideoFiles] = useState<{ [key: string]: File }>({})

  const { toast } = useToast()

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#10B981",
      frequency: "custom",
      icon: "🎵",
      hasVideo: false,
      hasAudio: true,
    })
    setAudioFiles({})
    setVideoFiles({})
    setEditingTherapy(null)
  }

  const handleCreateTherapy = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la terapia es requerido",
        variant: "destructive",
      })
      return
    }

    try {
      // Convertir archivos a URLs de blob
      const audioFileUrls: { [key: string]: string } = {}
      const videoFileUrls: { [key: string]: string } = {}

      // Procesar archivos de audio
      Object.entries(audioFiles).forEach(([duration, file]) => {
        audioFileUrls[duration] = URL.createObjectURL(file)
      })

      // Procesar archivos de video
      Object.entries(videoFiles).forEach(([duration, file]) => {
        videoFileUrls[duration] = URL.createObjectURL(file)
      })

      const newTherapy = {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        frequency: formData.frequency,
        icon: formData.icon,
        category: "custom" as const,
        hasVideo: formData.hasVideo,
        hasAudio: formData.hasAudio,
        audioFiles: audioFileUrls,
        videoFiles: videoFileUrls,
      }

      addTherapy(newTherapy)
      setShowCreateDialog(false)
      resetForm()

      toast({
        title: "Terapia creada",
        description: `"${formData.name}" se ha creado exitosamente`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error creando terapia:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la terapia",
        variant: "destructive",
      })
    }
  }

  const handleEditTherapy = (therapy: any) => {
    setEditingTherapy(therapy)
    setFormData({
      name: therapy.name,
      description: therapy.description,
      color: therapy.color,
      frequency: therapy.frequency,
      icon: therapy.icon,
      hasVideo: therapy.hasVideo || false,
      hasAudio: therapy.hasAudio || true,
    })
    setShowCreateDialog(true)
  }

  const handleUpdateTherapy = async () => {
    if (!editingTherapy) return

    try {
      const updates = {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        frequency: formData.frequency,
        icon: formData.icon,
        hasVideo: formData.hasVideo,
        hasAudio: formData.hasAudio,
      }

      updateTherapy(editingTherapy.id, updates)
      setShowCreateDialog(false)
      resetForm()

      toast({
        title: "Terapia actualizada",
        description: `"${formData.name}" se ha actualizado exitosamente`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error actualizando terapia:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la terapia",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTherapy = (therapyId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta terapia?")) {
      deleteTherapy(therapyId)
    }
  }

  const handleFileUpload = (type: "audio" | "video", duration: string, file: File) => {
    if (type === "audio") {
      setAudioFiles((prev) => ({ ...prev, [duration]: file }))
    } else {
      setVideoFiles((prev) => ({ ...prev, [duration]: file }))
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        await importTherapies(file)
      } catch (error) {
        console.error("Error importando terapias:", error)
      }
    }
    event.target.value = ""
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400">Cargando terapias personalizadas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Terapias Personalizadas</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-400 border-green-400">
            {customTherapies.length} personalizadas
          </Badge>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-green-600 hover:bg-green-500">
                <Plus className="h-4 w-4 mr-1" />
                Nueva
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTherapy ? "Editar Terapia" : "Crear Nueva Terapia"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="icon">Icono</Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                      className="bg-gray-700 border-gray-600"
                      placeholder="🎵"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                      className="bg-gray-700 border-gray-600 h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frecuencia</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, frequency: value }))}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="custom">Personalizada</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="relax">Relajación</SelectItem>
                        <SelectItem value="energy">Energía</SelectItem>
                        <SelectItem value="balance">Balance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Archivos de audio */}
                <div>
                  <Label>Archivos de Audio</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {["4", "15", "20"].map((duration) => (
                      <div key={duration} className="space-y-1">
                        <Label className="text-xs">{duration} min</Label>
                        <Input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload("audio", duration, file)
                          }}
                          className="bg-gray-700 border-gray-600 text-xs"
                        />
                        {audioFiles[duration] && (
                          <div className="text-xs text-green-400 flex items-center">
                            <FileAudio className="h-3 w-3 mr-1" />
                            {audioFiles[duration].name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Archivos de video */}
                {formData.hasVideo && (
                  <div>
                    <Label>Archivos de Video</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {["4", "15", "20"].map((duration) => (
                        <div key={duration} className="space-y-1">
                          <Label className="text-xs">{duration} min</Label>
                          <Input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload("video", duration, file)
                            }}
                            className="bg-gray-700 border-gray-600 text-xs"
                          />
                          {videoFiles[duration] && (
                            <div className="text-xs text-purple-400 flex items-center">
                              <FileVideo className="h-3 w-3 mr-1" />
                              {videoFiles[duration].name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.hasVideo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hasVideo: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Incluir video</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={editingTherapy ? handleUpdateTherapy : handleCreateTherapy}
                  className="bg-green-600 hover:bg-green-500"
                >
                  {editingTherapy ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Controles de importación/exportación */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={exportTherapies}
          disabled={customTherapies.length === 0}
          className="text-blue-400 border-blue-400 hover:bg-blue-900/20 bg-transparent"
        >
          <Download className="h-4 w-4 mr-1" />
          Exportar
        </Button>

        <label className="cursor-pointer">
          <Button
            variant="outline"
            size="sm"
            className="text-green-400 border-green-400 hover:bg-green-900/20 bg-transparent"
            asChild
          >
            <span>
              <Upload className="h-4 w-4 mr-1" />
              Importar
            </span>
          </Button>
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>

        {customTherapies.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("¿Estás seguro de que quieres eliminar todas las terapias personalizadas?")) {
                clearAllTherapies()
              }
            }}
            className="text-red-400 border-red-400 hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpiar Todo
          </Button>
        )}
      </div>

      {/* Lista de terapias personalizadas */}
      {customTherapies.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="py-8 text-center">
            <Plus className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-medium text-white mb-2">No hay terapias personalizadas</h3>
            <p className="text-gray-400 mb-4">Crea tu primera terapia personalizada para comenzar</p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-500">
              <Plus className="h-4 w-4 mr-1" />
              Crear Primera Terapia
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customTherapies.map((therapy) => (
            <Card
              key={therapy.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                selectedTherapy?.id === therapy.id
                  ? "bg-gray-700 border-green-400 shadow-lg shadow-green-400/20"
                  : "bg-gray-800 border-gray-700 hover:border-gray-600"
              }`}
              onClick={() => onSelectTherapy(therapy)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                      style={{
                        backgroundColor: `${therapy.color}20`,
                        border: `1px solid ${therapy.color}`,
                      }}
                    >
                      {therapy.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-white text-sm truncate">{therapy.name}</CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {therapy.hasVideo && <Badge className="bg-purple-600/80 text-white text-xs">Video</Badge>}
                    <Badge className="bg-green-600/80 text-white text-xs">Custom</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-400 text-xs mb-3 line-clamp-2">{therapy.description}</p>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <span>{therapy.frequency}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditTherapy(therapy)
                      }}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-blue-400"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTherapy(therapy.id)
                      }}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <Button
                  size="sm"
                  className={`w-full text-xs ${
                    selectedTherapy?.id === therapy.id
                      ? "bg-green-600 hover:bg-green-500 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  }`}
                  style={{
                    backgroundColor: selectedTherapy?.id === therapy.id ? therapy.color : undefined,
                  }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  {selectedTherapy?.id === therapy.id ? "Seleccionada" : "Seleccionar"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
