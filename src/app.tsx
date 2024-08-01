import { formatDate, normalizeDate, useControlledComponent } from '@shined/react-use'
import { create } from '@shined/reactive'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import confetti from 'canvas-confetti'
import { useInputComposition } from './hooks/use-input-composition'
import { cn } from './utils'

interface Work {
  id: number
  name: string
  done: boolean
  deleted: boolean
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

const cacheKey = '__work-done__works__'
const initialWorks = JSON.parse(localStorage.getItem(cacheKey) || '[]') as Work[]
const store = create({ works: initialWorks })

let globalId = Math.max(0, ...initialWorks.map((e) => e.id))

store.subscribe((changes) => {
  localStorage.setItem(cacheKey, JSON.stringify(changes.snapshot.works))
})

export function App() {
  const { isComposing } = useInputComposition('#work-input')
  const [automateInboxRef] = useAutoAnimate()
  const [automateDoneRef] = useAutoAnimate()
  const workInput = useControlledComponent('')
  const works = store.useSnapshot((s) => s.works.filter((w) => !w.deleted))

  const sortedWorks = works.sort((a, b) => {
    return a.done === b.done ? a.createdAt - b.createdAt : a.done ? 1 : -1
  })

  const inboxWorks = sortedWorks.filter((e) => !e.done)
  const doneWorks = sortedWorks.filter((e) => e.done).sort((a, b) => b.updatedAt - a.updatedAt)

  const doneCount = doneWorks.length
  const totalCount = sortedWorks.length

  const addWork = (name: string) => {
    if (name.trim() === '') return

    store.mutate.works.push({
      id: ++globalId,
      name,
      done: false,
      deleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    })

    workInput.setValue('')
  }

  return (
    <div className="size-screen grid place-content-center">
      <h1 className="text-amber m-0">
        Work Done ({doneCount}/{totalCount})
      </h1>

      <div className="flex flex-col gap-2 overflow-auto my-4">
        <div className="w-60vw h-60vh min-w-600px min-h-240px">
          <h2 className="my-1">Inbox ({inboxWorks.length})</h2>
          <div ref={automateInboxRef}>
            {inboxWorks.map((work) => (
              <div
                key={work.id}
                onClick={() => {
                  const target = store.mutate.works.find((w) => w.id === work.id)

                  if (target) {
                    target.done = !work.done
                    target.updatedAt = Date.now()

                    if (target.done) {
                      confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                      })
                    }
                  }
                }}
                className={cn(
                  'border-0 border-b-1 last:border-b-0 border-dashed border-amber/12',
                  'group hover:bg-zinc-2/12 rounded px-3 py-1 w-full flex justify-between items-center hover:cursor-pointer',
                )}
              >
                <div className={cn('text-xl', work.done && 'line-through opacity-60', work.deleted && 'text-red/50')}>
                  {work.name}
                </div>

                <div className="gap-2 items-center text-xs text-gray/60 hidden group-hover:flex">
                  <span>Created at</span>
                  <span className="font-mono">{formatDate(normalizeDate(work.createdAt), 'YYYY/MM/DD HH:mm:ss')}</span>
                </div>
              </div>
            ))}
            {inboxWorks.length === 0 && <div className="text-gray/60 mx-2">No works</div>}
          </div>

          <h2 className="mt-4 mb-0">Done ({doneWorks.length})</h2>
          <div ref={automateDoneRef}>
            {doneWorks.map((work) => (
              <div
                key={work.id}
                onClick={() => {
                  const target = store.mutate.works.find((w) => w.id === work.id)

                  if (target) {
                    target.deleted = !work.deleted
                    target.deletedAt = Date.now()
                  }
                }}
                className={cn(
                  'border-0 border-b-1 border-dashed last:border-b-0 border-amber/12',
                  'group hover:bg-zinc-2/12 rounded px-3 py-1 w-full flex justify-between items-center hover:cursor-pointer',
                )}
              >
                <div className={cn('text-xl', work.done && 'line-through opacity-60', work.deleted && 'text-red/50')}>
                  {work.name}
                </div>

                <div className="hidden group-hover:flex gap-2 items-center text-xs text-gray/60">
                  <span>Done at</span>
                  <span className="font-mono">{formatDate(normalizeDate(work.updatedAt), 'YYYY/MM/DD HH:mm:ss')}</span>

                  <button
                    type="button"
                    className="py-1 appearance-none border-none rounded"
                    onClick={(event) => {
                      event.stopPropagation()

                      const target = store.mutate.works.find((w) => w.id === work.id)

                      if (target) {
                        target.done = false
                        target.updatedAt = Date.now()
                      }
                    }}
                  >
                    Undo
                  </button>
                </div>
              </div>
            ))}

            {doneWorks.length === 0 && <div className="text-gray/60 mx-2">No works</div>}
          </div>
        </div>
      </div>

      <div className="flex gap-2 bottom-8 w-60vw bg-zinc-7/80 p-2 rounded">
        <input
          type="text"
          id="work-input"
          className="w-full min-w-120px text-xl appearance-none rounded border-none outline-none px-3 py-1"
          {...workInput.props}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            if (isComposing) return
            addWork(workInput.value)
          }}
        />
        <button
          type="button"
          className="px-3 py-1 text-xl appearance-none border-none rounded"
          onClick={() => {
            addWork(workInput.value)
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}
