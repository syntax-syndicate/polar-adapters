import { put } from "@vercel/blob"
import { StorageMeter } from "./storage"
import { CustomerContext } from "./usage"
import { describe, it, expect } from "vitest"

describe('StorageMeter', () => {
    it('should meter bytes going through the client', async () => {
        const meter = new StorageMeter(new CustomerContext(async () => ''), put)

        const result = await meter.handler(async (req, res, client) => {
            const fileWith20Bytes = 'a'.repeat(20)
            await client('test.txt', fileWith20Bytes, {
                contentType: 'text/plain',
                access: 'public',
            })

            return res
        })

        await result(null, null)

        expect(result).toBeDefined()
    })
})