import React, { useState } from 'react';
import { useTranslation } from '@/components/TranslationContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { GripVertical, Save, RotateCcw } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function DashboardCustomizer({ 
  availableCards, 
  currentLayout, 
  onSave, 
  onReset,
  open,
  onOpenChange 
}) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  
  const [cards, setCards] = useState(currentLayout || []);

  const handleToggle = (cardId) => {
    setCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, enabled: !card.enabled } : card
    ));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(cards);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setCards(updatedItems);
  };

  const handleSave = () => {
    onSave(cards);
  };

  const handleReset = () => {
    const defaultCards = availableCards.map((card, index) => ({
      id: card.id,
      enabled: true,
      order: index
    }));
    setCards(defaultCards);
    onReset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={isRTL ? 'text-right' : ''}>
            Customize Dashboard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Toggle cards on/off and drag to reorder them
          </p>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="cards">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {cards.map((card, index) => {
                    const cardInfo = availableCards.find(c => c.id === card.id);
                    if (!cardInfo) return null;

                    return (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`
                              border rounded-lg p-4 bg-white
                              ${snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'}
                            `}
                          >
                            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <div
                                {...provided.dragHandleProps}
                                className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>

                              <div className={`flex items-center gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <div className={`p-2 rounded-lg ${cardInfo.color || 'bg-emerald-100'}`}>
                                  <cardInfo.icon className="w-5 h-5 text-white" />
                                </div>
                                <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                                  <p className="font-medium text-slate-900">{cardInfo.title}</p>
                                  <p className="text-xs text-slate-500">{cardInfo.description}</p>
                                </div>
                              </div>

                              <Switch
                                checked={card.enabled}
                                onCheckedChange={() => handleToggle(card.id)}
                              />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <DialogFooter className={`gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {t('reset')} to Default
          </Button>
          <Button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            <Save className="w-4 h-4" />
            {t('save')} Layout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}