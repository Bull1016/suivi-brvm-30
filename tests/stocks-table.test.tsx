import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { StocksTable } from "../src/components/StocksTable";
import type { StockData } from "../src/types";

const stock: StockData = {
  name: "Test company", symbol: "TEST", country: "ci", sector: "Services Financiers",
  currentPrice: 1000, high: 1100, low: 900, variation: 0, dividends: [],
  streak: 0, latestDividend: 0, lastUpdated: "", source: "pending",
};

afterEach(cleanup);

it("keeps desktop row semantics and separates row, link and Details actions", () => {
  const onSelectStock = vi.fn();
  const { getByRole } = render(
    <StocksTable stocks={[stock]} selectedStock={null} onSelectStock={onSelectStock}
      sortField="" sortDirection="asc" onSort={vi.fn()} error={null} />
  );
  const table = within(getByRole("table"));
  const row = table.getAllByRole("row")[1];
  expect(row.hasAttribute("role")).toBe(false);
  expect(row.tabIndex).toBe(-1);
  expect(within(row).getAllByRole("cell")).toHaveLength(7);

  fireEvent.click(within(row).getByText(stock.name));
  expect(onSelectStock).toHaveBeenCalledExactlyOnceWith(stock);
  onSelectStock.mockClear();

  const link = within(row).getByRole("link");
  link.focus();
  // jsdom does not navigate on Enter; ensure the native action is not cancelled.
  expect(fireEvent.keyDown(link, { key: "Enter" })).toBe(true);
  fireEvent.click(within(link).getByText(stock.sector));
  expect(onSelectStock).not.toHaveBeenCalled();
  expect(link.getAttribute("href")).toBe("https://www.brvm.org/fr/cours-actions/198");

  const details = within(row).getByRole("button", { name: /Voir les détails/ });
  details.focus();
  expect(document.activeElement).toBe(details);
  expect(fireEvent.keyDown(details, { key: "Enter" })).toBe(true);
  // Native button activation emits click, including for keyboard activation.
  fireEvent.click(within(details).getByText("Détails"), { detail: 0 });
  expect(onSelectStock).toHaveBeenCalledExactlyOnceWith(stock);
});
