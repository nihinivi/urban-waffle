export type MEResponse<T> = {
    status: number
    statusText: string
    content?: T
}