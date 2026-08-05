const currencyFormatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
})

export function formatCurrency(amount: number): string {
    return currencyFormatter.format(amount)
}
