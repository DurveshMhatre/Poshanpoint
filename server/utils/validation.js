function sanitizeText(value, maxLength = 120) {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function sanitizePhone(phone) {
    if (phone === undefined || phone === null) return null;
    const clean = String(phone).replace(/\D/g, '').slice(-10);
    return clean.length === 10 ? clean : null;
}

function toMoney(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

function normalizeOption(option) {
    if (!option || typeof option !== 'object') return null;
    const name = sanitizeText(option.name, 50);
    const price = toMoney(option.price || 0);
    if (!name || price === null || price < 0) return null;
    return { name, price };
}

function normalizeMenuItemId(value) {
    if (!value) return undefined;
    const asString = String(value).trim();
    return /^[a-fA-F0-9]{24}$/.test(asString) ? asString : undefined;
}

function normalizeOrderItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return { valid: false, message: 'At least one item is required' };
    }

    const normalized = [];
    let computedTotal = 0;

    for (const rawItem of items) {
        if (!rawItem || typeof rawItem !== 'object') {
            return { valid: false, message: 'Invalid order items payload' };
        }

        const name = sanitizeText(rawItem.name, 120);
        const categoryName = sanitizeText(rawItem.categoryName, 80);
        const recipeType = sanitizeText(rawItem.recipeType, 40);
        const quantity = Number(rawItem.quantity);
        const basePrice = toMoney(rawItem.basePrice);

        if (!name) return { valid: false, message: 'Each item must include a name' };
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
            return { valid: false, message: 'Item quantity must be between 1 and 20' };
        }
        if (basePrice === null || basePrice < 0) {
            return { valid: false, message: 'Each item must include a valid basePrice' };
        }

        const selectedBase = normalizeOption(rawItem.selectedBase);
        const selectedLiquid = normalizeOption(rawItem.selectedLiquid);
        const selectedAddOns = Array.isArray(rawItem.selectedAddOns)
            ? rawItem.selectedAddOns.map(normalizeOption).filter(Boolean)
            : [];

        const addOnsTotal = selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
        const lineTotal = toMoney(
            (basePrice + (selectedBase?.price || 0) + (selectedLiquid?.price || 0) + addOnsTotal) * quantity
        );

        if (lineTotal === null) {
            return { valid: false, message: 'Invalid item pricing' };
        }

        normalized.push({
            menuItem: normalizeMenuItemId(rawItem.menuItem),
            name,
            categoryName,
            recipeType,
            quantity,
            basePrice,
            selectedBase,
            selectedLiquid,
            selectedAddOns,
            itemTotal: lineTotal,
        });

        computedTotal = toMoney(computedTotal + lineTotal);
    }

    return {
        valid: true,
        items: normalized,
        total: computedTotal,
    };
}

module.exports = {
    sanitizeText,
    sanitizePhone,
    toMoney,
    normalizeOrderItems,
};
