import React from "react";
import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
  },
  coverPage: {
    flexDirection: "column",
    backgroundColor: "#00b141",
    padding: 30,
    height: "100%",
  },
  logoContainer: {
    backgroundColor: "#002b3c",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    padding: 10,
  },
  logoBox: {
    width: 170,
    height: 38,
  },
  logoBoxSmall: {
    width: 135,
    height: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 30,
    color: "#fff",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 5,
    color: "#fff",
  },
  contentBox: {
    border: "1px solid #CBD5E1",
    borderRadius: 5,
    padding: 15,
    margin: "20px auto",
    width: "70%",
    backgroundColor: "white",
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#0F172A",
  },
  divider: {
    borderBottom: "1px solid #E2E8F0",
    marginVertical: 10,
  },
  dateText: {
    fontSize: 12,
    textAlign: "center",
    color: "#64748B",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    borderTop: "1px solid #E2E8F0",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  coverFooter: {
    textAlign: "center",
    fontSize: 10,
    color: "#fff",
    marginTop: "auto",
    marginBottom: 30,
  },
  headerLogo: {
    width: 80,
    height: 24,
    backgroundColor: "#4361EE",
    color: "white",
    borderRadius: 4,
    padding: 5,
    fontSize: 10,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#002b3c",
    justifyContent: "space-between",
    alignItems: "center",
    margin: -30,
    marginBottom: 20,
    borderBottom: "1px solid #E2E8F0",
    padding: 30,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 12,
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 15,
    color: "#475569",
  },
  chartPlaceholder: {
    width: 400,
    height: 300,
    backgroundColor: "#F1F5F9",
    marginVertical: 20,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  chartText: {
    color: "#64748B",
    fontSize: 12,
  },
  chartImage: {
    height: 150,
    marginVertical: 20,
    alignSelf: "center",
  },
  chartCaption: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 5,
    textAlign: "center",
  },
  questionItem: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: "1px solid #F1F5F9",
  },
  questionNumber: {
    fontSize: 10,
    color: "#64748B",
    marginBottom: 2,
  },
  questionText: {
    fontSize: 11,
    color: "#334155",
    marginBottom: 4,
  },
  answerLabel: {
    fontSize: 10,
    color: "#64748B",
  },
  answerValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  answerPositive: {
    color: "#16A34A",
  },
  answerNeutral: {
    color: "#6B7280",
  },
  answerNegative: {
    color: "#DC2626",
  },
  recommendationBox: {
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 5,
    marginVertical: 15,
  },
  recommendationItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  recommendationBullet: {
    width: 15,
    fontSize: 10,
    color: "#334155",
  },
  recommendationText: {
    fontSize: 10,
    flex: 1,
    color: "#334155",
  },
  // Styled cards for markdown recommendations
  recommendationCard: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 4,
    border: "1pt solid #E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  recommendationCardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 6,
  },
  recommendationCardText: {
    fontSize: 10,
    color: "#334155",
    marginVertical: 4,
    lineHeight: 1.4,
  },
  pageNumber: {
    fontSize: 10,
    color: "#94A3B8",
  },
});

export default styles;
