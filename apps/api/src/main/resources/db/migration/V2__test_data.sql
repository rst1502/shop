<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

    <!-- ============================================================ -->
    <!-- TEST DATA: Order with PayNow Payment                         -->
    <!-- Author : dev-test                                            -->
    <!-- Date   : 2026-03-11                                          -->
    <!-- Purpose: Seed a complete order to test PayNow checkout flow  -->
    <!-- ============================================================ -->

    <!-- 1. Insert a test customer (skip if customer already exists) -->
    <changeSet id="test-paynow-001-customer" author="dev-test" context="test">
        <preConditions onFail="MARK_RAN">
            <sqlCheck expectedResult="0">
SELECT COUNT(*) FROM customers WHERE email = 'paynow.test@example.com'
                                         </sqlCheck>
                                         </preConditions>
                                         <insert tableName="customers">
<column name="id"           value="cust-paynow-test-001"/>
<column name="first_name"   value="PayNow"/>
<column name="last_name"    value="Tester"/>
<column name="email"        value="paynow.test@example.com"/>
<column name="phone"        value="+263771234567"/>
<column name="created_at"   valueDate="2026-03-11T08:00:00"/>
<column name="updated_at"   valueDate="2026-03-11T08:00:00"/>
</insert>
<rollback>
<delete tableName="customers">
                <where>id = 'cust-paynow-test-001'</where>
            </delete>
        </rollback>
    </changeSet>

    <!-- 2. Insert the order -->
    <changeSet id="test-paynow-002-order" author="dev-test" context="test">
        <preConditions onFail="MARK_RAN">
            <sqlCheck expectedResult="0">
SELECT COUNT(*) FROM orders WHERE id = 'ord-paynow-test-001'
                                      </sqlCheck>
                                      </preConditions>
                                      <insert tableName="orders">
<column name="id"               value="ord-paynow-test-001"/>
<column name="customer_id"      value="cust-paynow-test-001"/>
<column name="status"           value="PENDING"/>
<column name="currency"         value="USD"/>
<column name="subtotal"         valueNumeric="45.00"/>
<column name="tax"              valueNumeric="3.15"/>
<column name="shipping_fee"     valueNumeric="2.00"/>
<column name="total_amount"     valueNumeric="50.15"/>
<column name="notes"            value="Test order for PayNow payment integration"/>
<column name="created_at"       valueDate="2026-03-11T08:05:00"/>
<column name="updated_at"       valueDate="2026-03-11T08:05:00"/>
</insert>
<rollback>
<delete tableName="orders">
                <where>id = 'ord-paynow-test-001'</where>
            </delete>
        </rollback>
    </changeSet>

    <!-- 3. Insert order line items -->
    <changeSet id="test-paynow-003-order-items" author="dev-test" context="test">
        <preConditions onFail="MARK_RAN">
            <sqlCheck expectedResult="0">
SELECT COUNT(*) FROM order_items WHERE order_id = 'ord-paynow-test-001'
                                           </sqlCheck>
                                           </preConditions>

    <!-- Item 1 -->
                                     <insert tableName="order_items">
<column name="id"           value="item-paynow-test-001"/>
<column name="order_id"     value="ord-paynow-test-001"/>
<column name="product_id"   value="prod-sample-001"/>
<column name="product_name" value="Sample Product A"/>
<column name="quantity"     valueNumeric="2"/>
<column name="unit_price"   valueNumeric="15.00"/>
<column name="line_total"   valueNumeric="30.00"/>
</insert>

<!-- Item 2 -->
<insert tableName="order_items">
<column name="id"           value="item-paynow-test-002"/>
<column name="order_id"     value="ord-paynow-test-001"/>
<column name="product_id"   value="prod-sample-002"/>
<column name="product_name" value="Sample Product B"/>
<column name="quantity"     valueNumeric="1"/>
<column name="unit_price"   valueNumeric="15.00"/>
<column name="line_total"   valueNumeric="15.00"/>
</insert>

<rollback>
<delete tableName="order_items">
                <where>order_id = 'ord-paynow-test-001'</where>
            </delete>
        </rollback>
    </changeSet>

    <!-- 4. Insert the PayNow payment record -->
    <changeSet id="test-paynow-004-payment" author="dev-test" context="test">
        <preConditions onFail="MARK_RAN">
            <sqlCheck expectedResult="0">
SELECT COUNT(*) FROM payments WHERE order_id = 'ord-paynow-test-001'
                                        </sqlCheck>
                                        </preConditions>
                                        <insert tableName="payments">
<column name="id"                   value="pay-paynow-test-001"/>
<column name="order_id"             value="ord-paynow-test-001"/>
<column name="payment_method"       value="PAYNOW"/>
<column name="payment_status"       value="PENDING"/>
<column name="amount"               valueNumeric="50.15"/>
<column name="currency"             value="USD"/>
<!-- Paynow-specific fields -->
<column name="paynow_reference"     value="TEST-REF-20260311-001"/>
<column name="paynow_poll_url"      value="https://www.paynow.co.zw/Interface/CheckPayment/?guid=test-guid-001"/>
<column name="paynow_redirect_url"  value="https://www.paynow.co.zw/Payment/ConfirmPayment/test-token-001"/>
<column name="paynow_return_url"    value="https://yourapp.com/orders/ord-paynow-test-001/confirm"/>
<column name="paynow_result_url"    value="https://yourapp.com/webhooks/paynow/result"/>
<column name="email"                value="paynow.test@example.com"/>
<column name="phone"                value="+263771234567"/>
<column name="created_at"           valueDate="2026-03-11T08:05:30"/>
<column name="updated_at"           valueDate="2026-03-11T08:05:30"/>
</insert>
<rollback>
<delete tableName="payments">
                <where>order_id = 'ord-paynow-test-001'</where>
            </delete>
        </rollback>
    </changeSet>

    <!-- 5. (Optional) Simulate a successful PayNow callback — uncomment to test paid state -->
    <!--
    <changeSet id="test-paynow-005-payment-success" author="dev-test" context="test">
        <update tableName="payments">
                                         <column name="payment_status"   value="PAID"/>
                                         <column name="paynow_reference" value="TEST-REF-20260311-001"/>
                                         <column name="updated_at"       valueDate="2026-03-11T08:10:00"/>
                                         <where>id = 'pay-paynow-test-001'</where>
                                                                                </update>
                                                                                      <update tableName="orders">
                                                                                           <column name="status"       value="CONFIRMED"/>
                                                                                           <column name="updated_at"   valueDate="2026-03-11T08:10:00"/>
                                                                                           <where>id = 'ord-paynow-test-001'</where>
                                                                                                                                  </update>
                                                                                                                                        <rollback>
                                                                                                                                        <update tableName="payments">
                                                                                                                                             <column name="payment_status" value="PENDING"/>
                                                                                                                                             <where>id = 'pay-paynow-test-001'</where>
                                                                                                                                                                                    </update>
                                                                                                                                                                                          <update tableName="orders">
                                                                                                                                                                                               <column name="status" value="PENDING"/>
                                                                                                                                                                                               <where>id = 'ord-paynow-test-001'</where>
                                                                                                                                                                                                                                      </update>
                                                                                                                                                                                                                                            </rollback>
                                                                                                                                                                                                                                            </changeSet>
                                                                                                                                                                                                                                            -->

                                                                                                                                                                                                                                            </databaseChangeLog>
