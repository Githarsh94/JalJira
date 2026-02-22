package com.agile.jaljira.models;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "plans")
public class Plan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> criteria;
    
    @Column(nullable = false)
    private BigDecimal cost;
    
    @Column(nullable = false)
    private Integer validity;
    
    // Constructors
    public Plan() {}
    
    public Plan(Map<String, Object> criteria, BigDecimal cost, Integer validity) {
        this.criteria = criteria;
        this.cost = cost;
        this.validity = validity;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public Map<String, Object> getCriteria() {
        return criteria;
    }
    
    public void setCriteria(Map<String, Object> criteria) {
        this.criteria = criteria;
    }
    
    public BigDecimal getCost() {
        return cost;
    }
    
    public void setCost(BigDecimal cost) {
        this.cost = cost;
    }
    
    public Integer getValidity() {
        return validity;
    }
    
    public void setValidity(Integer validity) {
        this.validity = validity;
    }
}
