vi.mock('@vercel/blob', async (importOriginal) => ({
    ...(await importOriginal()),
    put: vi.fn((pathname, body, optionsInput) => {
        return {
            pathname,
            body: body.getReader().read(),
            optionsInput
        }
    }),
}))

import { StorageMeter } from "./storage"
import { CustomerResolver } from "../customer/customer"
import { describe, it, expect, vi } from "vitest"

describe('StorageMeter', () => {
    it('should meter bytes going through the client', async () => {
        const meter = new StorageMeter(new CustomerResolver(async () => ''))

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