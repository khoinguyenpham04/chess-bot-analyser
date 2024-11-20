'use client'

import { useState, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { MoveAnalysis } from './move-analysis'

export function ChessGameComponent() {
  const [game, setGame] = useState(new Chess())
  const [message, setMessage] = useState<string>("White to move")
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [currentPosition, setCurrentPosition] = useState<string>(game.fen())
  const [lastMove, setLastMove] = useState<string | null>(null)
  const chessboardContainerRef = useRef<HTMLDivElement>(null)
  const [boardWidth, setBoardWidth] = useState(400)
  const [moveStack, setMoveStack] = useState<Chess[]>([new Chess()])
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)

  useEffect(() => {
    updateGameStatus()
  }, [game])

  useEffect(() => {
    const updateDimensions = () => {
      if (chessboardContainerRef.current) {
        setBoardWidth(chessboardContainerRef.current.offsetWidth)
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const updateGameStatus = () => {
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        setMessage(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`)
      } else if (game.isDraw()) {
        setMessage("Game drawn!")
      } else {
        setMessage("Game over!")
      }
    } else {
      if (game.isCheck()) {
        setMessage(`Check! ${game.turn() === 'w' ? 'White' : 'Black'} to move`)
      } else {
        setMessage(`${game.turn() === 'w' ? 'White' : 'Black'} to move`)
      }
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      })

      if (move) {
        const newGame = new Chess(game.fen())
        setMoveHistory([...moveHistory, move.san])
        setLastMove(move.san)
        setGame(newGame)
        setCurrentPosition(newGame.fen())
        
        // Update move stack
        const newMoveStack = moveStack.slice(0, currentMoveIndex + 1)
        newMoveStack.push(newGame)
        setMoveStack(newMoveStack)
        setCurrentMoveIndex(currentMoveIndex + 1)
        return true
      }
    } catch (error) {
      console.error("Invalid move:", error)
    }
    return false
  }

  const resetGame = () => {
    const newGame = new Chess()
    setGame(newGame)
    setMoveHistory([])
    setMessage("White to move")
    setLastMove(null)
    setCurrentPosition(newGame.fen())
    setMoveStack([newGame])
    setCurrentMoveIndex(0)
  }

  const canUndo = currentMoveIndex > 0
  const canRedo = currentMoveIndex < moveStack.length - 1

  const handleUndo = () => {
    if (canUndo) {
      const previousIndex = currentMoveIndex - 1
      const previousGame = moveStack[previousIndex]
      setGame(new Chess(previousGame.fen()))
      setCurrentPosition(previousGame.fen())
      setCurrentMoveIndex(previousIndex)
      setMoveHistory(moveHistory.slice(0, -1))
      setLastMove(moveHistory[moveHistory.length - 2] || null)
    }
  }

  const handleRedo = () => {
    if (canRedo) {
      const nextIndex = currentMoveIndex + 1
      const nextGame = moveStack[nextIndex]
      setGame(new Chess(nextGame.fen()))
      setCurrentPosition(nextGame.fen())
      setCurrentMoveIndex(nextIndex)
      setMoveHistory([...moveHistory, moveStack[nextIndex].history().pop() || ''])
      setLastMove(moveStack[nextIndex].history().pop() || null)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full max-w-6xl mx-auto p-4">
      <Card className="lg:w-[60%]">
        <CardContent className="p-4">
          <div 
            ref={chessboardContainerRef} 
            className="relative aspect-square w-full"
          >
            <Chessboard 
              position={game.fen()}
              onPieceDrop={onDrop}
              boardWidth={boardWidth}
              customBoardStyle={{
                borderRadius: '4px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
              }}
              customDarkSquareStyle={{ backgroundColor: '#b58863' }}
              customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 lg:w-[40%]">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-bold mb-2">Game Status</h2>
            <p className="text-base mb-4">{message}</p>
            <div className="flex gap-2 mb-4">
              <Button 
                onClick={handleUndo}
                disabled={!canUndo}
                variant="outline"
                size="sm"
              >
                Undo
              </Button>
              <Button 
                onClick={handleRedo}
                disabled={!canRedo}
                variant="outline"
                size="sm"
              >
                Redo
              </Button>
            </div>
            <Button 
              onClick={resetGame} 
              className="relative w-full mb-4 bg-gray-800 shadow-[5px_5px_10px_rgba(0,0,0,0.3),-5px_-5px_10px_rgba(255,255,255,0.05)] overflow-hidden
                before:absolute before:inset-[2px] before:z-[2] before:bg-gray-800 before:rounded-md
                after:absolute after:inset-[-2px] after:animate-[gradient_5s_linear_infinite] after:bg-[length:200%] 
                after:bg-gradient-to-r after:from-[#ff0000] after:via-[#00ff00,#0000ff,#ff0000] after:to-[#ff0000]"
            >
              <span className="relative z-[2] text-gray-100 text-bold">New Game</span>
            </Button>
            <h3 className="text-lg font-semibold mb-2">Move History</h3>
            <ScrollArea className="h-32 w-full rounded-md border p-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {moveHistory.map((move, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {index % 2 === 0 && (
                      <span className="text-muted-foreground">{Math.floor(index / 2) + 1}.</span>
                    )}
                    <span>{move}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        <Card className="flex-grow max-h-[calc(100vh-24rem)]">
          <CardContent className="p-4 h-full">
            <MoveAnalysis 
              move={lastMove}
              position={currentPosition}
              moveHistory={moveHistory}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}